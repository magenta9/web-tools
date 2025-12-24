'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
    variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    onCancel,
    variant = 'warning',
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)
    const confirmButtonRef = useRef<HTMLButtonElement>(null)

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel()
            } else if (e.key === 'Tab' && dialogRef.current) {
                const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                const firstElement = focusableElements[0]
                const lastElement = focusableElements[focusableElements.length - 1]

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault()
                    lastElement?.focus()
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault()
                    firstElement?.focus()
                }
            }
        },
        [onCancel]
    )

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            confirmButtonRef.current?.focus()
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    const variantColors = {
        danger: '#ef4444',
        warning: '#f59e0b',
        info: 'var(--accent-color)',
    }

    return (
        <div
            className="confirm-overlay"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
        >
            <div
                ref={dialogRef}
                className="confirm-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="confirm-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle
                        size={18}
                        style={{ color: variantColors[variant] }}
                    />
                    {title}
                </h3>
                <p id="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button
                        className="panel-btn"
                        onClick={onCancel}
                        type="button"
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        className="cyber-btn-small"
                        onClick={onConfirm}
                        type="button"
                        style={{
                            background: variant === 'danger' ? '#ef4444' : undefined,
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
