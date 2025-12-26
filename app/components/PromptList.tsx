interface PromptListProps {
    prompts: Prompt[]
    onEdit: (prompt: Prompt) => void
    onDelete: (prompt: Prompt) => void
    onUse: (prompt: Prompt) => void
}

export function PromptList({ prompts, onEdit, onDelete, onUse }: PromptListProps) {
    if (prompts.length === 0) {
        return (
            <div className="empty-state">
                <p>暂无 Prompt</p>
            </div>
        )
    }

    return (
        <div className="prompt-list">
            {prompts.map((prompt) => (
                <div key={prompt.id} className="prompt-list-item" onClick={() => onUse(prompt)}>
                    <div className="prompt-list-main">
                        <div className="prompt-list-header">
                            <h3 className="prompt-list-title">{prompt.title}</h3>
                            {prompt.tags && prompt.tags.length > 0 && (
                                <div className="prompt-list-tags">
                                    <Tag size={12} />
                                    {prompt.tags.map((tag, index) => (
                                        <span key={index} className="tag-small">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="prompt-list-preview">
                            {prompt.content.length > 100
                                ? prompt.content.substring(0, 100) + '...'
                                : prompt.content}
                        </p>
                        <div className="prompt-list-meta">
                            <span className="prompt-use-count">
                                <Copy size={12} /> {prompt.use_count} 次
                            </span>
                            <span className="prompt-date">
                                {new Date(prompt.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="prompt-list-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="icon-btn"
                            onClick={() => onEdit(prompt)}
                            title="编辑"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            className="icon-btn"
                            onClick={() => onDelete(prompt)}
                            title="删除"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
