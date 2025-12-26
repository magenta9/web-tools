'use client'

import React, { useState, useMemo } from 'react'
import {
    Plus,
    Search,
    Grid,
    List as ListIcon,
    Tag,
    Filter,
    X
} from 'lucide-react'
import Layout from '../components/Layout'
import { PromptCard, PromptList, PromptForm } from '../components'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { usePrompts, useConfirm } from '../hooks'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import type { Prompt, PromptViewMode } from '@/types'
import '../tools.css'
import './prompt.css'

export default function PromptManager() {
    const [viewMode, setViewMode] = useState<PromptViewMode>('card')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [showForm, setShowForm] = useState(false)
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
    const [showTagFilter, setShowTagFilter] = useState(false)

    const toast = useToastContext()
    const { t } = useI18n()

    const {
        prompts,
        allTags,
        loading,
        createPrompt,
        updatePrompt,
        deletePrompt,
        incrementUseCount,
        loadPrompts
    } = usePrompts({ autoLoad: true })

    const confirmDialog = useConfirm()

    const filteredPrompts = useMemo(() => {
        let filtered = prompts

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                p =>
                    p.title.toLowerCase().includes(query) ||
                    p.content.toLowerCase().includes(query)
            )
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(p =>
                selectedTags.some(tag => p.tags.includes(tag))
            )
        }

        return filtered
    }, [prompts, searchQuery, selectedTags])

    const handleCreateNew = () => {
        setEditingPrompt(null)
        setShowForm(true)
    }

    const handleEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt)
        setShowForm(true)
    }

    const handleDelete = async (prompt: Prompt) => {
        const confirmed = await confirmDialog.confirm({
            title: '删除 Prompt',
            message: `确定要删除 "${prompt.title}" 吗？此操作无法撤销。`,
            variant: 'danger',
        })
        if (confirmed) {
            await deletePrompt(prompt.id)
        }
    }

    const handleUse = async (prompt: Prompt) => {
        await incrementUseCount(prompt.id)
        navigator.clipboard.writeText(prompt.content)
        toast.success('Prompt 已复制到剪贴板')
    }

    const handleSubmit = async (data: any) => {
        if (editingPrompt) {
            await updatePrompt(editingPrompt.id, data)
        } else {
            await createPrompt(data)
        }
    }

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    const clearFilters = () => {
        setSearchQuery('')
        setSelectedTags([])
    }

    return (
        <Layout>
            <div className="prompt-manager">
                <div className="prompt-header">
                    <div className="prompt-title-section">
                        <h1>Prompt 管理</h1>
                        <p className="subtitle">管理和使用你的 AI Prompt 模板</p>
                    </div>
                    <button className="btn-primary" onClick={handleCreateNew}>
                        <Plus size={16} /> 新建 Prompt
                    </button>
                </div>

                <div className="prompt-toolbar">
                    <div className="search-bar">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="搜索 Prompt..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="icon-btn" onClick={() => setSearchQuery('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="toolbar-actions">
                        <button
                            className={`toolbar-btn ${showTagFilter ? 'active' : ''}`}
                            onClick={() => setShowTagFilter(!showTagFilter)}
                        >
                            <Filter size={16} />
                            标签筛选
                            {selectedTags.length > 0 && (
                                <span className="badge">{selectedTags.length}</span>
                            )}
                        </button>

                        {(searchQuery || selectedTags.length > 0) && (
                            <button className="toolbar-btn" onClick={clearFilters}>
                                <X size={16} />
                                清除筛选
                            </button>
                        )}

                        <div className="view-mode-toggle">
                            <button
                                className={`icon-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => setViewMode('card')}
                                title="卡片视图"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="列表视图"
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {showTagFilter && allTags.length > 0 && (
                    <div className="tag-filter-panel">
                        <div className="tag-filter-header">
                            <Tag size={14} />
                            <span>选择标签筛选</span>
                        </div>
                        <div className="tag-filter-list">
                            {allTags.map((tag, index) => (
                                <button
                                    key={index}
                                    className={`tag-filter-item ${selectedTags.includes(tag) ? 'active' : ''
                                        }`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="prompt-stats">
                    <span>共 {filteredPrompts.length} 个 Prompt</span>
                    {selectedTags.length > 0 && (
                        <span>
                            · 已选标签: {selectedTags.map(t => `#${t}`).join(', ')}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="loading-state">
                        <p>加载中...</p>
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="empty-state">
                        <p>
                            {searchQuery || selectedTags.length > 0
                                ? '没有找到匹配的 Prompt'
                                : '还没有 Prompt，点击上方按钮创建第一个'}
                        </p>
                    </div>
                ) : viewMode === 'card' ? (
                    <div className="prompt-grid">
                        {filteredPrompts.map(prompt => (
                            <PromptCard
                                key={prompt.id}
                                prompt={prompt}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onUse={handleUse}
                            />
                        ))}
                    </div>
                ) : (
                    <PromptList
                        prompts={filteredPrompts}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onUse={handleUse}
                    />
                )}

                {showForm && (
                    <PromptForm
                        prompt={editingPrompt}
                        allTags={allTags}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowForm(false)
                            setEditingPrompt(null)
                        }}
                    />
                )}

                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    confirmText="删除"
                    cancelText="取消"
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={confirmDialog.onCancel}
                    variant={confirmDialog.variant}
                />
            </div>
        </Layout>
    )
}
