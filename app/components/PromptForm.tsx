'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import type { Prompt, PromptFormData } from '@/types'

interface PromptFormProps {
    prompt?: Prompt | null
    allTags: string[]
    onSubmit: (data: PromptFormData) => Promise<void>
    onCancel: () => void
}

export function PromptForm({ prompt, allTags, onSubmit, onCancel }: PromptFormProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (prompt) {
            setTitle(prompt.title)
            setContent(prompt.content)
            setTags(prompt.tags || [])
        } else {
            setTitle('')
            setContent('')
            setTags([])
        }
    }, [prompt])

    const handleAddTag = () => {
        const trimmed = newTag.trim()
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed])
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove))
    }

    const handleSelectTag = (tag: string) => {
        if (!tags.includes(tag)) {
            setTags([...tags, tag])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !content.trim()) return

        setSubmitting(true)
        try {
            await onSubmit({
                title: title.trim(),
                content: content.trim(),
                tags
            })
            onCancel()
        } catch (err) {
            console.error('Failed to submit prompt:', err)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{prompt ? '编辑 Prompt' : '新建 Prompt'}</h2>
                    <button className="icon-btn" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="prompt-form">
                    <div className="form-group">
                        <label htmlFor="title">标题 *</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="输入 Prompt 标题"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="content">内容 *</label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="输入 Prompt 内容"
                            rows={8}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>标签</label>
                        <div className="tag-input-container">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddTag()
                                    }
                                }}
                                placeholder="添加标签"
                            />
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={handleAddTag}
                                disabled={!newTag.trim()}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {tags.length > 0 && (
                            <div className="selected-tags">
                                {tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        <TagIcon size={12} />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="tag-remove"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {allTags.length > 0 && (
                            <div className="suggested-tags">
                                <span className="suggested-tags-label">常用标签：</span>
                                {allTags
                                    .filter(tag => !tags.includes(tag))
                                    .slice(0, 10)
                                    .map((tag, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="tag-suggestion"
                                            onClick={() => handleSelectTag(tag)}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting || !title.trim() || !content.trim()}
                        >
                            {submitting ? '保存中...' : (prompt ? '更新' : '创建')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
