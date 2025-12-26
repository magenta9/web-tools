import { useState, useCallback, useEffect, useRef } from 'react'
import { useToastContext } from '../providers/ToastProvider'
import type { Prompt, PromptFormData } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface UsePromptsOptions {
    autoLoad?: boolean
    search?: string
    tags?: string[]
}

export function usePrompts(options: UsePromptsOptions = {}) {
    // Use refs to track the latest options without triggering re-renders
    const optionsRef = useRef(options)
    optionsRef.current = options

    const { autoLoad = true } = options
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [allTags, setAllTags] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const toast = useToastContext()

    const loadPrompts = useCallback(async (searchQuery?: string, filterTags?: string[]) => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            if (searchQuery) params.append('search', searchQuery)
            if (filterTags && filterTags.length > 0) params.append('tags', filterTags.join(','))

            const response = await fetch(`${API_BASE}/prompts?${params}`)
            const data = await response.json()

            if (data.success) {
                setPrompts(data.prompts || [])
            } else {
                throw new Error(data.error || 'Failed to load prompts')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load prompts'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [toast])

    const loadTags = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/prompts/tags`)
            const data = await response.json()

            if (data.success) {
                setAllTags(data.tags || [])
            }
        } catch (err) {
            console.error('Failed to load tags:', err)
        }
    }, [])

    const createPrompt = useCallback(async (formData: PromptFormData) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/prompts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await response.json()

            if (data.success) {
                toast.success('Prompt 创建成功')
                const { search = '', tags = [] } = optionsRef.current
                await loadPrompts(search, tags)
                await loadTags()
                return data.prompt
            } else {
                throw new Error(data.error || 'Failed to create prompt')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create prompt'
            toast.error(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [toast, loadPrompts, loadTags])

    const updatePrompt = useCallback(async (id: number, formData: PromptFormData) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/prompts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await response.json()

            if (data.success) {
                toast.success('Prompt 更新成功')
                const { search = '', tags = [] } = optionsRef.current
                await loadPrompts(search, tags)
                await loadTags()
            } else {
                throw new Error(data.error || 'Failed to update prompt')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update prompt'
            toast.error(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [toast, loadPrompts, loadTags])

    const deletePrompt = useCallback(async (id: number) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE}/prompts/${id}`, {
                method: 'DELETE'
            })
            const data = await response.json()

            if (data.success) {
                toast.success('Prompt 删除成功')
                const { search = '', tags = [] } = optionsRef.current
                await loadPrompts(search, tags)
                await loadTags()
            } else {
                throw new Error(data.error || 'Failed to delete prompt')
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete prompt'
            toast.error(message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [toast, loadPrompts, loadTags])

    const incrementUseCount = useCallback(async (id: number) => {
        try {
            await fetch(`${API_BASE}/prompts/${id}/use`, {
                method: 'POST'
            })
        } catch (err) {
            console.error('Failed to increment use count:', err)
        }
    }, [])

    useEffect(() => {
        if (autoLoad) {
            const { search = '', tags = [] } = optionsRef.current
            loadPrompts(search, tags)
            loadTags()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoLoad])

    return {
        prompts,
        allTags,
        loading,
        error,
        loadPrompts,
        loadTags,
        createPrompt,
        updatePrompt,
        deletePrompt,
        incrementUseCount
    }
}
