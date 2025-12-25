-- Tool history table
CREATE TABLE IF NOT EXISTS tool_history (
    id SERIAL PRIMARY KEY,
    tool_name VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Config table
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_tool_history_tool_name ON tool_history(tool_name);
CREATE INDEX idx_tool_history_created_at ON tool_history(created_at DESC);
