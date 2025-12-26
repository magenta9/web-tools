package handler

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/webtools/server/internal/model"
	"github.com/webtools/server/internal/repository"
)

type PromptHandler struct {
	repo *repository.Repository
}

func NewPromptHandler(repo *repository.Repository) *PromptHandler {
	return &PromptHandler{repo: repo}
}

func (h *PromptHandler) Create(c *gin.Context) {
	var req struct {
		Title   string   `json:"title"`
		Content string   `json:"content"`
		Tags    []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Title == "" || req.Content == "" {
		c.JSON(400, gin.H{"success": false, "error": "title and content are required"})
		return
	}

	prompt := &model.Prompt{
		Title:   req.Title,
		Content: req.Content,
		Tags:    req.Tags,
	}

	result, err := h.repo.CreatePrompt(c.Request.Context(), prompt)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "prompt": result})
}

func (h *PromptHandler) List(c *gin.Context) {
	search := c.Query("search")
	tagsParam := c.Query("tags")
	var tags []string
	if tagsParam != "" {
		tags = strings.Split(tagsParam, ",")
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	prompts, err := h.repo.GetPrompts(c.Request.Context(), search, tags, limit)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "prompts": prompts})
}

func (h *PromptHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{"success": false, "error": "invalid id"})
		return
	}

	prompt, err := h.repo.GetPrompt(c.Request.Context(), id)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "prompt": prompt})
}

func (h *PromptHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{"success": false, "error": "invalid id"})
		return
	}

	var req struct {
		Title   string   `json:"title"`
		Content string   `json:"content"`
		Tags    []string `json:"tags"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Title == "" || req.Content == "" {
		c.JSON(400, gin.H{"success": false, "error": "title and content are required"})
		return
	}

	prompt := &model.Prompt{
		ID:      id,
		Title:   req.Title,
		Content: req.Content,
		Tags:    req.Tags,
	}

	err = h.repo.UpdatePrompt(c.Request.Context(), prompt)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

func (h *PromptHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{"success": false, "error": "invalid id"})
		return
	}

	err = h.repo.DeletePrompt(c.Request.Context(), id)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

func (h *PromptHandler) IncrementUse(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.JSON(400, gin.H{"success": false, "error": "invalid id"})
		return
	}

	err = h.repo.IncrementPromptUseCount(c.Request.Context(), id)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

func (h *PromptHandler) GetTags(c *gin.Context) {
	tags, err := h.repo.GetAllTags(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "tags": tags})
}
