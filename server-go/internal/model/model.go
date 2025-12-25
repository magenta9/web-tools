package model

import "time"

type ToolHistory struct {
	ID         int64     `json:"id"`
	ToolName   string    `json:"tool_name"`
	InputData  any       `json:"input_data"`
	OutputData any       `json:"output_data"`
	CreatedAt  time.Time `json:"created_at"`
}

type Config struct {
	Key       string    `json:"key"`
	Value     any       `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}
