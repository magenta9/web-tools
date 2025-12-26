'use client'

import React, { useState, useMemo } from 'react'
import { Search, X, BookText, Copy, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { usePrompts } from '../hooks'
import type { Prompt } from '@/types'

interface PromptSelectorProps {
    onSelect: (prompt: Prompt) => void
    onClose: () => void
    visible: boolean
}

export function PromptSelector({ onSelect, onClose, visible }: PromptSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null)

    const { prompts, allTags, loading } = usePrompts({ autoLoad: visible })

    const filteredPrompts = useMemo(() => {
        let filtered = prompts

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                p =>
                    p.title.toLowerCase().includes(query) ||
                    p.content.toLowerCase().includes(query) ||
                    p.tags.some(tag => tag.toLowerCase().includes(query))
            )
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(p =>
                selectedTags.some(tag => p.tags.includes(tag))
            )
        }

        return filtered
    }, [prompts, searchQuery, selectedTags])

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    const handleSelect = (prompt: Prompt) => {
        onSelect(prompt)
        onClose()
    }

    const toggleExpand = (id: number) => {
        setExpandedPrompt(expandedPrompt === id ? null : id)
    }

    if (!visible) return null

    return (
        <div className="prompt-selector-overlay" onClick={onClose}>
            <div className="prompt-selector-panel" onClick={(e) => e.stopPropagation()}>
                <div className="prompt-selector-header">
                    <div className="prompt-selector-title">
                        <BookText size={18} />
                        <h3>选择 Prompt 模板</h3>
                    </div>
                    <button className="icon-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="prompt-selector-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="搜索 Prompt..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {searchQuery && (
                        <button className="icon-btn" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {allTags.length > 0 && (
                    <div className="prompt-selector-tags">
                        <Tag size={14} />
                        <div className="tag-list">
                            {allTags.slice(0, 8).map((tag, index) => (
                                <button
                                    key={index}
                                    className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="prompt-selector-content">
                    {loading ? (
                        <div className="selector-loading">加载中...</div>
                    ) : filteredPrompts.length === 0 ? (
                        <div className="selector-empty">
                            {searchQuery || selectedTags.length > 0
                                ? '没有找到匹配的 Prompt'
                                : '还没有 Prompt 模板'}
                        </div>
                    ) : (
                        <div className="prompt-selector-list">
                            {filteredPrompts.map((prompt) => (
                                <div key={prompt.id} className="prompt-selector-item">
                                    <div
                                        className="prompt-selector-item-header"
                                        onClick={() => toggleExpand(prompt.id)}
                                    >
                                        <div className="prompt-item-info">
                                            <h4>{prompt.title}</h4>
                                            {prompt.tags.length > 0 && (
                                                <div className="prompt-item-tags">
                                                    {prompt.tags.slice(0, 3).map((tag, index) => (
                                                        <span key={index} className="tag-mini">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="prompt-item-actions">
                                            <span className="use-count">
                                                <Copy size={12} /> {prompt.use_count}
                                            </span>
                                            <button className="icon-btn">
                                                {expandedPrompt === prompt.id ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {expandedPrompt === prompt.id && (
                                        <div className="prompt-selector-item-content">
                                            <pre className="prompt-preview-text">{prompt.content}</pre>
                                            <button
                                                className="btn-select"
                                                onClick={() => handleSelect(prompt)}
                                            >
                                                使用此模板
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="prompt-selector-footer">
                    <span className="prompt-count">
                        共 {filteredPrompts.length} 个模板
                    </span>
                </div>
            </div>
        </div>
    )
}
