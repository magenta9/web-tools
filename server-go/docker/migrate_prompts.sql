-- Migration script to add prompts table
-- Run this if your database is already initialized

-- Create prompts table if not exists
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_use_count ON prompts(use_count DESC);

-- Insert sample prompts for testing
INSERT INTO prompts (title, content, tags) VALUES
('代码审查助手', '请帮我审查以下代码，关注：
1. 代码质量和可读性
2. 潜在的 bug 和安全问题
3. 性能优化建议
4. 最佳实践建议

代码：
[在此粘贴代码]', ARRAY['代码', '开发', '审查']),

('翻译助手', '请将以下内容翻译成{目标语言}，要求：
- 保持原文的语气和风格
- 使用地道的表达
- 注意专业术语的准确性

原文：
[在此粘贴文本]', ARRAY['翻译', '语言', '工作']),

('文档生成器', '请为以下代码生成详细的文档，包括：
- 功能描述
- 参数说明
- 返回值说明
- 使用示例
- 注意事项

代码：
[在此粘贴代码]', ARRAY['文档', '代码', '开发']),

('SQL 查询优化', '请帮我优化以下 SQL 查询：
1. 分析查询性能瓶颈
2. 提供优化建议
3. 给出优化后的 SQL
4. 解释优化原理

原始查询：
[在此粘贴 SQL]', ARRAY['SQL', '数据库', '优化']),

('Bug 分析助手', '我遇到了一个 bug，请帮我分析：

错误信息：
[粘贴错误信息]

相关代码：
[粘贴相关代码]

请提供：
1. 问题根源分析
2. 解决方案
3. 预防措施', ARRAY['调试', '开发', '问题解决'])

ON CONFLICT DO NOTHING;

-- Display success message
SELECT 'Prompts table migration completed successfully!' as message;
