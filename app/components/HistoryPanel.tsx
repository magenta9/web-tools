'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  History,
  Trash2,
  X,
  Inbox,
  Upload,
  Trash
} from 'lucide-react'
import { formatTimestamp } from '../utils/format'
import { BaseHistoryItem } from '../hooks/useHistory'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'

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

const historyLabelStyle = {
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: 'Orbitron, monospace',
  background: 'rgba(0, 255, 255, 0.1)',
  color: 'var(--accent-color)',
  border: '1px solid var(--border-color)'
} as const

const previewStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '12px',
  color: 'var(--text-primary)',
  background: 'var(--bg-secondary)',
  padding: '8px',
  borderRadius: '4px',
  maxHeight: '80px',
  overflowY: 'auto' as const,
  wordBreak: 'break-all' as const
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
    const toast = useToastContext()
    const { t } = useI18n()
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean
        type: 'clearAll' | 'delete'
        deleteIndex?: number
    }>({ isOpen: false, type: 'clearAll' })
    const panelRef = useRef<HTMLDivElement>(null)

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose()
        }
    }, [onClose])

    useEffect(() => {
        if (visible) {
            document.addEventListener('keydown', handleKeyDown)
            panelRef.current?.focus()
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [visible, handleKeyDown])

    if (!visible) return null

    const handleClearAll = () => {
        setConfirmState({ isOpen: true, type: 'clearAll' })
    }

    const handleDelete = (index: number) => {
        setConfirmState({ isOpen: true, type: 'delete', deleteIndex: index })
    }

    const handleConfirm = () => {
        if (confirmState.type === 'clearAll') {
            onClearAll()
            toast.success(t.history.cleared)
        } else if (confirmState.type === 'delete' && confirmState.deleteIndex !== undefined) {
            onDelete(confirmState.deleteIndex)
            toast.success(t.history.deleted)
        }
        setConfirmState({ isOpen: false, type: 'clearAll' })
    }

    const handleCancel = () => {
        setConfirmState({ isOpen: false, type: 'clearAll' })
    }

    const handleLoad = (item: T) => {
        onLoad(item)
        toast.success(t.history.loaded)
    }

    return (
        <div className="history-panel active">
            <div className="history-content">
                <div className="history-header">
                    <h2 className="history-title">
                        <History size={18} /> {title}
                    </h2>
                    <div>
                        <button
                            className="cyber-btn-small"
                            onClick={handleClearAll}
                            style={{ marginRight: '10px' }}
                        >
                            <Trash2 size={14} /> 清空所有
                        </button>
                        <button
                            className="cyber-btn-small"
                            onClick={onClose}
                        >
                            <X size={14} /> 关闭
                        </button>
                    </div>
                </div>
                <div className="history-list">
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <div key={`${item.type}-${item.timestamp}`} className="history-item">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={historyLabelStyle}>
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
                                        <Trash size={14} />
                                    </button>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>输入:</div>
                                    <div style={previewStyle}>
                                        {renderItemPreview(item)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                        onClick={() => handleLoad(item)}
                                        className="cyber-btn-small"
                                    >
                                        <Upload size={14} /> 加载
                                    </button>
                                    {renderItemActions && renderItemActions(item, index)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <Inbox size={32} />
                            <p>暂无历史记录</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.type === 'clearAll' ? t.history.clearAll : t.common.delete}
                message={confirmState.type === 'clearAll' ? t.history.clearConfirm : t.history.deleteConfirm}
                confirmText={t.common.confirm}
                cancelText={t.common.cancel}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                variant="danger"
            />
        </div>
    )
}
