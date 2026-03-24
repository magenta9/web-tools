/**
 * Shared type definitions for web-tools
 */

// JSON related types
export interface JsonObject {
    [key: string]: JsonValue
}

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[]

export type JsonProcessingMode = 'format' | 'minify' | 'escape' | 'unescape' | 'fix'

// History related types
export interface BaseHistoryItem {
    type: string
    input: string
    output: string
    timestamp: number
}

export interface JsonHistoryItem extends BaseHistoryItem {
    mode: JsonProcessingMode
}

export interface ImageHistoryItem extends BaseHistoryItem {
    type: 'key_to_url' | 'url_to_key'
}

export interface JwtHistoryItem extends BaseHistoryItem {
    type: 'encode' | 'decode'
}

export interface TimestampHistoryItem extends BaseHistoryItem {
    type: 'timestamp_to_date' | 'date_to_timestamp'
}

// Diff related types
export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface DiffLine {
    type: DiffType
    path: string
    key: string
    oldValue?: string
    newValue?: string
}

export interface DiffStats {
    added: number
    removed: number
}

// URL item for image converter
export interface UrlItem {
    label: string
    url: string
    icon: string
}

// Conversion result for timestamp
export interface ConversionResult {
    label: string
    value: string | number
}

// Tab types
export type ImageTab = 'key-to-url' | 'url-to-key'
export type JwtTab = 'decode' | 'encode'

// Validation status
export type ValidationStatus = 'valid' | 'invalid' | 'empty'

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
    id: string
    type: ToastType
    message: string
    duration?: number
}

// LocalStorage type guard helpers
export function isJsonHistoryItem(item: unknown): item is JsonHistoryItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'type' in item &&
        'input' in item &&
        'output' in item &&
        'timestamp' in item &&
        'mode' in item
    )
}

export function isBaseHistoryItem(item: unknown): item is BaseHistoryItem {
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

export function isHistoryArray<T extends BaseHistoryItem>(
    data: unknown,
    validator: (item: unknown) => item is T
): data is T[] {
    return Array.isArray(data) && data.every(validator)
}

// Error type guard
export function isError(error: unknown): error is Error {
    return error instanceof Error
}

export function getErrorMessage(error: unknown): string {
    if (isError(error)) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'An unknown error occurred'
}
