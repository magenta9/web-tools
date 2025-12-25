'use client'

import { useState, useCallback, useEffect } from 'react'
import { MAX_HISTORY_ITEMS } from '@/constants'

export interface BaseHistoryItem {
    type: string
    input: string
    output: string
    timestamp: number
    data?: Record<string, unknown>
}

export interface UseHistoryOptions {
    storageKey: string
    toolName?: string
    maxItems?: number
}

function isBaseHistoryItem(item: unknown): item is BaseHistoryItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        typeof (item as BaseHistoryItem).type === 'string' &&
        'input' in item &&
        typeof (item as BaseHistoryItem).input === 'string' &&
        'output' in item &&
        typeof (item as BaseHistoryItem).output === 'string' &&
        'timestamp' in item &&
        typeof (item as BaseHistoryItem).timestamp === 'number'
    )
}

function isHistoryArray(data: unknown): data is BaseHistoryItem[] {
    return Array.isArray(data) && data.every(isBaseHistoryItem)
}

function safeGetFromStorage<T extends BaseHistoryItem>(key: string): T[] {
    if (typeof window === 'undefined') return []

    try {
        const stored = localStorage.getItem(key)
        if (!stored) return []

        const parsed: unknown = JSON.parse(stored)
        if (isHistoryArray(parsed)) {
            return parsed as T[]
        }

        console.warn(`Invalid history data format for key: ${key}`)
        return []
    } catch (error) {
        console.error(`Failed to parse history for key ${key}:`, error)
        return []
    }
}

function safeSetToStorage<T extends BaseHistoryItem>(key: string, data: T[]): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
        console.error(`Failed to save history for key ${key}:`, error)
    }
}

// Backend API functions
async function saveToBackend(toolName: string, item: BaseHistoryItem): Promise<void> {
    if (!toolName) return

    try {
        await fetch('http://localhost:3001/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tool_name: toolName,
                input_data: { type: item.type, input: item.input, data: item.data },
                output_data: { output: item.output }
            })
        })
    } catch (error) {
        console.error('Failed to save history to backend:', error)
    }
}

async function loadFromBackend(toolName: string, limit = 50): Promise<(BaseHistoryItem & { id?: number })[]> {
    if (!toolName) return []

    try {
        const response = await fetch(`http://localhost:3001/api/history?tool_name=${toolName}&limit=${limit}`)
        if (!response.ok) return []

        const data = await response.json()
        if (data.success && data.history) {
            return data.history.map((h: any) => ({
                id: h.id,
                type: h.input_data?.type || 'default',
                input: h.input_data?.input || '',
                output: h.output_data?.output || '',
                timestamp: new Date(h.created_at).getTime(),
                data: h.input_data?.data
            }))
        }
        return []
    } catch (error) {
        console.error('Failed to load history from backend:', error)
        return []
    }
}

async function deleteFromBackend(id: number): Promise<boolean> {
    try {
        const response = await fetch(`http://localhost:3001/api/history/${id}`, {
            method: 'DELETE'
        })
        return response.ok
    } catch (error) {
        console.error('Failed to delete history from backend:', error)
        return false
    }
}

async function clearFromBackend(toolName: string): Promise<boolean> {
    try {
        const response = await fetch(`http://localhost:3001/api/history?tool_name=${toolName}`, {
            method: 'DELETE'
        })
        return response.ok
    } catch (error) {
        console.error('Failed to clear history from backend:', error)
        return false
    }
}

export function useHistory<T extends BaseHistoryItem>(options: UseHistoryOptions) {
    const { storageKey, toolName, maxItems = MAX_HISTORY_ITEMS } = options
    const [history, setHistory] = useState<T[]>([])
    const [historyVisible, setHistoryVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const loadHistory = useCallback(() => {
        const savedHistory = safeGetFromStorage<T>(storageKey)
        setHistory(savedHistory)
    }, [storageKey])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    const saveToHistory = useCallback((item: Omit<T, 'timestamp'>, syncToBackend = true) => {
        const newItem = {
            ...item,
            timestamp: Date.now()
        } as T

        setHistory(prev => {
            const updatedHistory = [newItem, ...prev].slice(0, maxItems)
            safeSetToStorage(storageKey, updatedHistory)
            return updatedHistory
        })

        // Sync to backend if toolName is provided and syncToBackend is true
        if (toolName && syncToBackend) {
            saveToBackend(toolName, newItem)
        }
    }, [storageKey, maxItems, toolName])

    const deleteHistoryItem = useCallback((index: number) => {
        const item = history[index]
        // Delete from backend if item has id
        if (item && 'id' in item && (item as any).id) {
            deleteFromBackend((item as any).id)
        }
        setHistory(prev => {
            const updatedHistory = prev.filter((_, i) => i !== index)
            safeSetToStorage(storageKey, updatedHistory)
            return updatedHistory
        })
    }, [storageKey, history])

    const clearAllHistory = useCallback(() => {
        // Clear from backend
        if (toolName) {
            clearFromBackend(toolName)
        }
        setHistory([])
        if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey)
        }
    }, [storageKey, toolName])

    const showHistory = useCallback(async () => {
        setHistoryVisible(true)
        // Auto-load from backend when opening history
        if (toolName && !isLoading) {
            setIsLoading(true)
            try {
                const backendHistory = await loadFromBackend(toolName)
                if (backendHistory.length > 0) {
                    setHistory(prev => {
                        const merged = [...backendHistory, ...prev]
                        const unique = merged.filter((item, index, self) =>
                            index === self.findIndex((t) => t.timestamp === item.timestamp)
                        )
                        const final = unique.slice(0, maxItems)
                        safeSetToStorage(storageKey, final as T[])
                        return final as T[]
                    })
                }
            } finally {
                setIsLoading(false)
            }
        }
    }, [toolName, storageKey, maxItems, isLoading])
    const hideHistory = useCallback(() => setHistoryVisible(false), [])

    const loadFromBackendHistory = useCallback(async () => {
        if (!toolName || isLoading) return

        setIsLoading(true)
        try {
            const backendHistory = await loadFromBackend(toolName)
            if (backendHistory.length > 0) {
                // Merge with local storage, preferring newer items
                setHistory(prev => {
                    const merged = [...backendHistory, ...prev]
                    // Remove duplicates based on timestamp
                    const unique = merged.filter((item, index, self) =>
                        index === self.findIndex((t) => t.timestamp === item.timestamp)
                    )
                    const final = unique.slice(0, maxItems)
                    safeSetToStorage(storageKey, final as T[])
                    return final as T[]
                })
            }
        } finally {
            setIsLoading(false)
        }
    }, [toolName, storageKey, maxItems, isLoading])

    return {
        history,
        historyVisible,
        saveToHistory,
        deleteHistoryItem,
        clearAllHistory,
        showHistory,
        hideHistory,
        loadHistory,
        isLoading
    }
}
