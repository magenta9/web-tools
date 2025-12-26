'use client'

import { useState, useCallback, useRef } from 'react'

interface ConfirmState {
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'warning' | 'info'
}

const initialState: ConfirmState = {
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>(initialState)
    const resolveRef = useRef<((result: boolean) => void) | null>(null)

    const confirm = useCallback(
        (options: {
            title: string
            message: string
            variant?: 'danger' | 'warning' | 'info'
        }): Promise<boolean> => {
            return new Promise((resolve) => {
                resolveRef.current = resolve
                setState({
                    isOpen: true,
                    title: options.title,
                    message: options.message,
                    variant: options.variant ?? 'warning',
                })
            })
        },
        []
    )

    const handleConfirm = useCallback(() => {
        resolveRef.current?.(true)
        resolveRef.current = null
        setState(initialState)
    }, [])

    const handleCancel = useCallback(() => {
        resolveRef.current?.(false)
        resolveRef.current = null
        setState(initialState)
    }, [])

    return {
        ...state,
        confirm,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
    }
}
