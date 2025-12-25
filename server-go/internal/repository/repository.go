package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/webtools/server/internal/config"
	"github.com/webtools/server/internal/model"
)

type Repository struct {
	pool *pgxpool.Pool
}

func New(cfg *config.Config) (*Repository, error) {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		return nil, err
	}

	return &Repository{pool: pool}, nil
}

func (r *Repository) Close() {
	r.pool.Close()
}

func (r *Repository) SaveHistory(ctx context.Context, h *model.ToolHistory) error {
	inputJSON, _ := json.Marshal(h.InputData)
	outputJSON, _ := json.Marshal(h.OutputData)

	_, err := r.pool.Exec(ctx,
		`INSERT INTO tool_history (tool_name, input_data, output_data) VALUES ($1, $2, $3)`,
		h.ToolName, inputJSON, outputJSON)
	return err
}

func (r *Repository) GetHistory(ctx context.Context, toolName string, limit int) ([]model.ToolHistory, error) {
	if limit <= 0 {
		limit = 50
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, tool_name, input_data, output_data, created_at 
		 FROM tool_history WHERE tool_name = $1 
		 ORDER BY created_at DESC LIMIT $2`, toolName, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.ToolHistory
	for rows.Next() {
		var h model.ToolHistory
		var inputJSON, outputJSON []byte
		if err := rows.Scan(&h.ID, &h.ToolName, &inputJSON, &outputJSON, &h.CreatedAt); err != nil {
			return nil, err
		}
		json.Unmarshal(inputJSON, &h.InputData)
		json.Unmarshal(outputJSON, &h.OutputData)
		results = append(results, h)
	}
	return results, nil
}

func (r *Repository) GetConfig(ctx context.Context, key string) (*model.Config, error) {
	var c model.Config
	var valueJSON []byte
	err := r.pool.QueryRow(ctx,
		`SELECT key, value, updated_at FROM config WHERE key = $1`, key).
		Scan(&c.Key, &valueJSON, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(valueJSON, &c.Value)
	return &c, nil
}

func (r *Repository) SetConfig(ctx context.Context, key string, value any) error {
	valueJSON, _ := json.Marshal(value)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO config (key, value, updated_at) VALUES ($1, $2, NOW())
		 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, key, valueJSON)
	return err
}
