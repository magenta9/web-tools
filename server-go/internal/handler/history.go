package handler

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/webtools/server/internal/model"
	"github.com/webtools/server/internal/repository"
)

type HistoryHandler struct {
	repo *repository.Repository
}

func NewHistoryHandler(repo *repository.Repository) *HistoryHandler {
	return &HistoryHandler{repo: repo}
}

func (h *HistoryHandler) Save(c *gin.Context) {
	var req struct {
		ToolName   string `json:"tool_name"`
		InputData  any    `json:"input_data"`
		OutputData any    `json:"output_data"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.ToolName == "" {
		c.JSON(400, gin.H{"success": false, "error": "tool_name is required"})
		return
	}

	err := h.repo.SaveHistory(c.Request.Context(), &model.ToolHistory{
		ToolName:   req.ToolName,
		InputData:  req.InputData,
		OutputData: req.OutputData,
	})
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true})
}

func (h *HistoryHandler) Get(c *gin.Context) {
	toolName := c.Query("tool_name")
	if toolName == "" {
		c.JSON(400, gin.H{"success": false, "error": "tool_name is required"})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	history, err := h.repo.GetHistory(c.Request.Context(), toolName, limit)
	if err != nil {
		c.JSON(500, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"success": true, "history": history})
}
