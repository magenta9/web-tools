package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/webtools/server/internal/config"
)

type OllamaHandler struct {
	host string
}

func NewOllamaHandler(cfg *config.Config) *OllamaHandler {
	return &OllamaHandler{host: cfg.OllamaHost}
}

type OllamaModel struct {
	Name       string `json:"name"`
	Size       int64  `json:"size"`
	ModifiedAt string `json:"modified_at"`
}

func (h *OllamaHandler) GetModels(c *gin.Context) {
	resp, err := http.Get(h.host + "/api/tags")
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}
	defer resp.Body.Close()

	var result map[string]any
	json.NewDecoder(resp.Body).Decode(&result)

	models := []OllamaModel{}
	if modelList, ok := result["models"].([]any); ok {
		for _, model := range modelList {
			if mm, ok := model.(map[string]any); ok {
				modelObj := OllamaModel{}
				if name, ok := mm["name"].(string); ok {
					modelObj.Name = name
				}
				if size, ok := mm["size"].(float64); ok {
					modelObj.Size = int64(size)
				}
				if modifiedAt, ok := mm["modified_at"].(string); ok {
					modelObj.ModifiedAt = modifiedAt
				}
				models = append(models, modelObj)
			}
		}
	}

	c.JSON(200, gin.H{"success": true, "models": models, "host": h.host})
}

func (h *OllamaHandler) Generate(c *gin.Context) {
	var req struct {
		Prompt string `json:"prompt"`
		Schema string `json:"schema"`
		Model  string `json:"model"`
		DbType string `json:"dbType"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Prompt == "" {
		c.JSON(400, gin.H{"success": false, "error": "Prompt is required"})
		return
	}

	dbType := req.DbType
	if dbType == "" {
		dbType = "mysql"
	}

	fullPrompt := req.Prompt
	if req.Schema != "" {
		if dbType == "postgres" {
			fullPrompt = fmt.Sprintf(`You are a PostgreSQL expert. Based on the following database schema, write a PostgreSQL query for the request.

Database Schema:
%s

Request: %s

Write only the SQL query, nothing else. Do not include markdown code blocks. Use PostgreSQL syntax (e.g., SERIAL for auto-increment, $1 for parameters if needed).`, req.Schema, req.Prompt)
		} else {
			fullPrompt = fmt.Sprintf(`You are a MySQL expert. Based on the following database schema, write a MySQL query for the request.

Database Schema:
%s

Request: %s

Write only the SQL query, nothing else. Do not include markdown code blocks.`, req.Schema, req.Prompt)
		}
	}

	model := req.Model
	if model == "" {
		model = "llama3.2"
	}

	result, err := h.generate(fullPrompt, model)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	// Clean up the SQL (remove markdown code blocks if any)
	sql := result
	sql = strings.TrimPrefix(sql, "```sql")
	sql = strings.TrimPrefix(sql, "```")
	sql = strings.TrimSuffix(sql, "```")
	sql = strings.TrimSpace(sql)

	c.JSON(200, gin.H{"success": true, "sql": sql})
}

func (h *OllamaHandler) Chat(c *gin.Context) {
	var req struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Message == "" {
		c.JSON(400, gin.H{"success": false, "error": "Message is required"})
		return
	}

	result, err := h.generate(req.Message, "llama3.2")
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "response": result})
}

func (h *OllamaHandler) Translate(c *gin.Context) {
	var req struct {
		Text       string `json:"text"`
		SourceLang string `json:"sourceLang"`
		TargetLang string `json:"targetLang"`
		Style      string `json:"style"`
		Model      string `json:"model"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "error": "Invalid request"})
		return
	}
	if req.Text == "" || req.SourceLang == "" || req.TargetLang == "" {
		c.JSON(400, gin.H{"success": false, "error": "Text, source language, and target language are required"})
		return
	}
	if req.SourceLang == req.TargetLang {
		c.JSON(400, gin.H{"success": false, "error": "Source and target languages cannot be the same"})
		return
	}

	langNames := map[string]string{"zh": "Chinese", "en": "English", "ja": "Japanese"}
	srcLang := langNames[req.SourceLang]
	if srcLang == "" {
		srcLang = req.SourceLang
	}
	tgtLang := langNames[req.TargetLang]
	if tgtLang == "" {
		tgtLang = req.TargetLang
	}

	styleInstr := "Use clear, natural language that is neither too casual nor overly formal."
	switch req.Style {
	case "casual":
		styleInstr = "Use casual, conversational language that sounds natural and friendly."
	case "formal":
		styleInstr = "Use formal, professional language with precise terminology."
	}

	prompt := fmt.Sprintf(`You are a professional translator. Translate the following %s text to %s.
Style: %s
Rules: Provide ONLY the translation, no explanations.

Text: %s

Translation:`, srcLang, tgtLang, styleInstr, req.Text)

	model := req.Model
	if model == "" {
		model = "llama3.2"
	}

	result, err := h.generate(prompt, model)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "translation": result})
}

func (h *OllamaHandler) generate(prompt, model string) (string, error) {
	body, _ := json.Marshal(map[string]any{
		"model":  model,
		"prompt": prompt,
		"stream": false,
		"options": map[string]any{
			"temperature": 0.1,
			"num_predict": 2000,
		},
	})

	resp, err := http.Post(h.host+"/api/generate", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	var result map[string]any
	json.Unmarshal(data, &result)

	if response, ok := result["response"].(string); ok {
		return response, nil
	}
	return "", fmt.Errorf("invalid response from Ollama")
}
