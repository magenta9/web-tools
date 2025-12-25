package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	APIPort    string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	OllamaHost string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		APIPort:    getEnv("API_PORT", "3001"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "webtools"),
		DBPassword: getEnv("DB_PASSWORD", "webtools123"),
		DBName:     getEnv("DB_NAME", "webtools"),
		OllamaHost: getEnv("OLLAMA_HOST", "http://localhost:11434"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
