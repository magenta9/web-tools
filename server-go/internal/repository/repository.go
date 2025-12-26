package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

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

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	// 连接池调优配置
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	// 启动时验证连接
	if err := pool.Ping(context.Background()); err != nil {
		return nil, err
	}

	return &Repository{pool: pool}, nil
}

func (r *Repository) Close() {
	r.pool.Close()
}

func (r *Repository) SaveHistory(ctx context.Context, h *model.ToolHistory) error {
	inputJSON, err := json.Marshal(h.InputData)
	if err != nil {
		return fmt.Errorf("failed to marshal input_data: %w", err)
	}
	outputJSON, err := json.Marshal(h.OutputData)
	if err != nil {
		return fmt.Errorf("failed to marshal output_data: %w", err)
	}

	_, err = r.pool.Exec(ctx,
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
		if err := json.Unmarshal(inputJSON, &h.InputData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal input_data: %w", err)
		}
		if err := json.Unmarshal(outputJSON, &h.OutputData); err != nil {
			return nil, fmt.Errorf("failed to unmarshal output_data: %w", err)
		}
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
	if err := json.Unmarshal(valueJSON, &c.Value); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config value: %w", err)
	}
	return &c, nil
}

func (r *Repository) SetConfig(ctx context.Context, key string, value any) error {
	valueJSON, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal config value: %w", err)
	}
	_, err = r.pool.Exec(ctx,
		`INSERT INTO config (key, value, updated_at) VALUES ($1, $2, NOW())
		 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, key, valueJSON)
	return err
}

func (r *Repository) DeleteHistory(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM tool_history WHERE id = $1`, id)
	return err
}

func (r *Repository) ClearHistory(ctx context.Context, toolName string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM tool_history WHERE tool_name = $1`, toolName)
	return err
}

// Prompt methods
func (r *Repository) CreatePrompt(ctx context.Context, p *model.Prompt) (*model.Prompt, error) {
	var id int64
	err := r.pool.QueryRow(ctx,
		`INSERT INTO prompts (title, content, tags) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`,
		p.Title, p.Content, p.Tags).Scan(&id, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.ID = id
	return p, nil
}

func (r *Repository) GetPrompts(ctx context.Context, search string, tags []string, limit int) ([]model.Prompt, error) {
	if limit <= 0 {
		limit = 100
	}

	query := `SELECT id, title, content, tags, use_count, created_at, updated_at FROM prompts WHERE 1=1`
	args := []interface{}{}
	argCount := 1

	if search != "" {
		query += fmt.Sprintf(` AND (title ILIKE $%d OR content ILIKE $%d)`, argCount, argCount)
		args = append(args, "%"+search+"%")
		argCount++
	}

	if len(tags) > 0 {
		query += fmt.Sprintf(` AND tags && $%d`, argCount)
		args = append(args, tags)
		argCount++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + fmt.Sprintf("%d", argCount)
	args = append(args, limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []model.Prompt
	for rows.Next() {
		var p model.Prompt
		if err := rows.Scan(&p.ID, &p.Title, &p.Content, &p.Tags, &p.UseCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		results = append(results, p)
	}
	return results, nil
}

func (r *Repository) GetPrompt(ctx context.Context, id int64) (*model.Prompt, error) {
	var p model.Prompt
	err := r.pool.QueryRow(ctx,
		`SELECT id, title, content, tags, use_count, created_at, updated_at FROM prompts WHERE id = $1`, id).
		Scan(&p.ID, &p.Title, &p.Content, &p.Tags, &p.UseCount, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) UpdatePrompt(ctx context.Context, p *model.Prompt) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE prompts SET title = $1, content = $2, tags = $3, updated_at = NOW() WHERE id = $4`,
		p.Title, p.Content, p.Tags, p.ID)
	return err
}

func (r *Repository) DeletePrompt(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM prompts WHERE id = $1`, id)
	return err
}

func (r *Repository) IncrementPromptUseCount(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE prompts SET use_count = use_count + 1 WHERE id = $1`, id)
	return err
}

func (r *Repository) GetAllTags(ctx context.Context) ([]string, error) {
	rows, err := r.pool.Query(ctx, `SELECT DISTINCT unnest(tags) as tag FROM prompts ORDER BY tag`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tags []string
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, nil
}
