'use client'

import React, { useEffect, useState } from 'react'
import {
    CheckCircle,
    AlertCircle,
    Info,
    AlertTriangle,
    X
} from 'lucide-react'
import type { ToastType, ToastMessage } from '@/types'
import { TOAST_DURATION } from '@/constants'

interface ToastItemProps {
    toast: ToastMessage
    onRemove: (id: string) => void
}

const iconMap: Record<ToastType, React.ElementType> = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const [isExiting, setIsExiting] = useState(false)
    const Icon = iconMap[toast.type]

    useEffect(() => {
        const duration = toast.duration ?? TOAST_DURATION.NORMAL
        const timer = setTimeout(() => {
            setIsExiting(true)
            setTimeout(() => onRemove(toast.id), 300)
        }, duration)

        return () => clearTimeout(timer)
    }, [toast, onRemove])

    const handleClose = () => {
        setIsExiting(true)
        setTimeout(() => onRemove(toast.id), 300)
    }

    return (
        <div
            className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <Icon size={18} className="toast-icon" />
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-close"
                onClick={handleClose}
                aria-label="Close notification"
            >
                <X size={14} />
            </button>
        </div>
    )
}

interface ToastContainerProps {
    toasts: ToastMessage[]
    onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return (
        <div className="toast-container" role="region" aria-label="Notifications">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    )
}
