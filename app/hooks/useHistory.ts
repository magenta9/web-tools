'use client'

import { useState, useCallback, useEffect } from 'react'

export interface BaseHistoryItem {
    type: string
    input: string
    output: string
    timestamp: number
}

export interface UseHistoryOptions<T extends BaseHistoryItem> {
    storageKey: string
    maxItems?: number
}

export function useHistory<T extends BaseHistoryItem>(options: UseHistoryOptions<T>) {
    const { storageKey, maxItems = 100 } = options
    const [history, setHistory] = useState<T[]>([])
    const [historyVisible, setHistoryVisible] = useState(false)

    const loadHistory = useCallback(() => {
        if (typeof window === 'undefined') return
        const savedHistory = localStorage.getItem(storageKey)
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory))
            } catch (e) {
                console.error('Failed to parse history:', e)
            }
        }
    }, [storageKey])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    const saveToHistory = useCallback((item: Omit<T, 'timestamp'>) => {
        const newItem = {
            ...item,
            timestamp: Date.now()
        } as T

        setHistory(prev => {
            const updatedHistory = [newItem, ...prev].slice(0, maxItems)
            localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
            return updatedHistory
        })
    }, [storageKey, maxItems])

    const deleteHistoryItem = useCallback((index: number) => {
        setHistory(prev => {
            const updatedHistory = prev.filter((_, i) => i !== index)
            localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
            return updatedHistory
        })
    }, [storageKey])

    const clearAllHistory = useCallback(() => {
        setHistory([])
        localStorage.removeItem(storageKey)
    }, [storageKey])

    const showHistory = useCallback(() => setHistoryVisible(true), [])
    const hideHistory = useCallback(() => setHistoryVisible(false), [])

    return {
        history,
        historyVisible,
        saveToHistory,
        deleteHistoryItem,
        clearAllHistory,
        showHistory,
        hideHistory,
        loadHistory
    }
}
