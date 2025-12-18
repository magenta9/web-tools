'use client'

import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faHistory,
    faTrashAlt,
    faTimes,
    faInbox,
    faUpload,
    faTrash
} from '@fortawesome/free-solid-svg-icons'
import { formatTimestamp } from '../utils/format'
import { BaseHistoryItem } from '../hooks/useHistory'

export interface HistoryPanelProps<T extends BaseHistoryItem> {
    visible: boolean
    title: string
    history: T[]
    onClose: () => void
    onClearAll: () => void
    onDelete: (index: number) => void
    onLoad: (item: T) => void
    renderItemLabel: (item: T) => string
    renderItemPreview: (item: T) => React.ReactNode
    renderItemActions?: (item: T, index: number) => React.ReactNode
}

export function HistoryPanel<T extends BaseHistoryItem>({
    visible,
    title,
    history,
    onClose,
    onClearAll,
    onDelete,
    onLoad,
    renderItemLabel,
    renderItemPreview,
    renderItemActions
}: HistoryPanelProps<T>) {
    if (!visible) return null

    const handleClearAll = () => {
        if (window.confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
            onClearAll()
            alert('已清空所有历史记录')
        }
    }

    const handleDelete = (index: number) => {
        if (window.confirm('确定要删除这条历史记录吗？')) {
            onDelete(index)
            alert('已删除历史记录')
        }
    }

    const handleLoad = (item: T) => {
        onLoad(item)
        alert('已加载历史记录')
    }

    return (
        <div className="history-panel active">
            <div className="history-content">
                <div className="history-header">
                    <h2 className="history-title">
                        <FontAwesomeIcon icon={faHistory} /> {title}
                    </h2>
                    <div>
                        <button
                            className="cyber-btn-small"
                            onClick={handleClearAll}
                            style={{ marginRight: '10px' }}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} /> 清空所有
                        </button>
                        <button
                            className="cyber-btn-small"
                            onClick={onClose}
                        >
                            <FontAwesomeIcon icon={faTimes} /> 关闭
                        </button>
                    </div>
                </div>
                <div className="history-list">
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <div key={index} className="history-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontFamily: 'Orbitron, monospace',
                                            background: 'rgba(0, 255, 255, 0.1)',
                                            color: 'var(--accent-color)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {renderItemLabel(item)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {formatTimestamp(item.timestamp)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="panel-btn"
                                        style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>输入:</div>
                                    <div style={{
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '12px',
                                        color: 'var(--text-primary)',
                                        background: 'var(--bg-secondary)',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        maxHeight: '80px',
                                        overflowY: 'auto',
                                        wordBreak: 'break-all'
                                    }}>
                                        {renderItemPreview(item)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                        onClick={() => handleLoad(item)}
                                        className="cyber-btn-small"
                                    >
                                        <FontAwesomeIcon icon={faUpload} /> 加载
                                    </button>
                                    {renderItemActions && renderItemActions(item, index)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <FontAwesomeIcon icon={faInbox} />
                            <p>暂无历史记录</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
