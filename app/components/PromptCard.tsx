interface PromptCardProps {
    prompt: Prompt
    onEdit: (prompt: Prompt) => void
    onDelete: (prompt: Prompt) => void
    onUse: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onEdit, onDelete, onUse }: PromptCardProps) {
    return (
        <div className="prompt-card" onClick={() => onUse(prompt)}>
            <div className="prompt-card-header">
                <h3 className="prompt-card-title">{prompt.title}</h3>
                <div className="prompt-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="icon-btn"
                        onClick={() => onEdit(prompt)}
                        title="编辑"
                    >
                        <Edit size={14} />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={() => onDelete(prompt)}
                        title="删除"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="prompt-card-content">
                <p className="prompt-preview">
                    {prompt.content.length > 150
                        ? prompt.content.substring(0, 150) + '...'
                        : prompt.content}
                </p>
            </div>

            {prompt.tags && prompt.tags.length > 0 && (
                <div className="prompt-card-tags">
                    <Tag size={12} />
                    {prompt.tags.map((tag, index) => (
                        <span key={index} className="tag">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="prompt-card-footer">
                <span className="prompt-use-count">
                    <Copy size={12} /> 使用 {prompt.use_count} 次
                </span>
                <span className="prompt-date">
                    {new Date(prompt.created_at).toLocaleDateString()}
                </span>
            </div>
        </div>
    )
}
