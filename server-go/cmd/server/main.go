package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/webtools/server/internal/config"
	"github.com/webtools/server/internal/handler"
	"github.com/webtools/server/internal/repository"
)

func main() {
	cfg := config.Load()

	// Repository (optional - continues without DB if unavailable)
	repo, err := repository.New(cfg)
	if err != nil {
		log.Printf("Warning: Database unavailable: %v", err)
	} else {
		defer repo.Close()
	}

	// Handlers
	ollamaH := handler.NewOllamaHandler(cfg)
	dbH := handler.NewDBHandler()
	var historyH *handler.HistoryHandler
	var promptH *handler.PromptHandler
	if repo != nil {
		historyH = handler.NewHistoryHandler(repo)
		promptH = handler.NewPromptHandler(repo)
	}

	// Router
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		MaxAge:           12 * time.Hour,
	}))

	// Request logging
	r.Use(func(c *gin.Context) {
		log.Printf("%s %s %s", time.Now().Format(time.RFC3339), c.Request.Method, c.Request.URL.Path)
		c.Next()
	})

	// Routes
	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok", "timestamp": time.Now().Format(time.RFC3339)})
		})

		// Ollama
		ollama := api.Group("/ollama")
		{
			ollama.GET("/models", ollamaH.GetModels)
			ollama.POST("/generate", ollamaH.Generate)
			ollama.POST("/chat", ollamaH.Chat)
			ollama.POST("/translate", ollamaH.Translate)
		}

		// Database
		db := api.Group("/db")
		{
			db.POST("/connect", dbH.Connect)
			db.POST("/databases", dbH.GetDatabases)
			db.POST("/schema", dbH.GetSchema)
			db.POST("/execute", dbH.Execute)
		}

		// History (only if DB available)
		if historyH != nil {
			api.POST("/history", historyH.Save)
			api.GET("/history", historyH.Get)
			api.DELETE("/history/:id", historyH.Delete)
			api.DELETE("/history", historyH.Clear)
		}

		// Prompts (only if DB available)
		if promptH != nil {
			prompts := api.Group("/prompts")
			{
				prompts.POST("", promptH.Create)
				prompts.GET("", promptH.List)
				prompts.GET("/tags", promptH.GetTags)
				prompts.GET("/:id", promptH.Get)
				prompts.PUT("/:id", promptH.Update)
				prompts.DELETE("/:id", promptH.Delete)
				prompts.POST("/:id/use", promptH.IncrementUse)
			}
		}
	}

	log.Printf("Server running on http://localhost:%s", cfg.APIPort)
	log.Printf("Ollama host: %s", cfg.OllamaHost)
	if err := r.Run(":" + cfg.APIPort); err != nil {
		log.Fatal(err)
	}
}
