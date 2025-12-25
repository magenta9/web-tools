/**
 * Shared constants for web-tools
 */

// CDN URLs
export const CDN_URLS = {
    BASE: 'https://cdn.lokboxes.ai/',
    FRENCH: 'https://cdn.flippop.fun/',
} as const

// Image optimization presets
export const IMAGE_PRESETS = {
    WEBP_QUALITY_75: 'cdn-cgi/image/quality=75,format=webp/',
    WIDTH_400_QUALITY_75: 'cdn-cgi/image/width=400,quality=75/',
    WIDTH_800_QUALITY_85: 'cdn-cgi/image/width=800,quality=85/',
} as const

// JSON formatting
export const JSON_INDENT_OPTIONS = [
    { value: 2, label: '2 空格' },
    { value: 4, label: '4 空格' },
    { value: 0, label: 'Tab' },
] as const

export const DEFAULT_JSON_INDENT = 2

// History
export const MAX_HISTORY_ITEMS = 100
export const HISTORY_PREVIEW_LENGTH = 200

// Storage keys
export const STORAGE_KEYS = {
    JSON_HISTORY: 'json_history',
    IMAGE_HISTORY: 'image_history',
    JWT_HISTORY: 'jwt_history',
    TIMESTAMP_HISTORY: 'timestamp_history',
    AISQL_HISTORY: 'aisql_history',
    JSONFIX_HISTORY: 'jsonfix_history',
    DIFF_HISTORY: 'diff_history',
    TRANSLATE_HISTORY: 'translate_history',
    THEME: 'theme',
    LOCALE: 'locale',
} as const

// Toast durations (ms)
export const TOAST_DURATION = {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
} as const

// Debounce delays (ms)
export const DEBOUNCE_DELAY = {
    LIVE_MODE: 500,
    SEARCH: 300,
} as const

// Timezone offsets (hours)
export const TIMEZONE_OFFSETS = {
    CHINA: 8,
} as const

// Time constants (ms)
export const TIME_MS = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
} as const

// JWT defaults
export const JWT_DEFAULTS = {
    ALGORITHM: 'HS256',
    TYPE: 'JWT',
    SECRET: 'your-secret-key',
} as const

// Example data
export const EXAMPLES = {
    IMAGE_KEY: 'flippop/image/item/story/1996218524934668288/202512040537/6b3b2b76167b42c6a7ecfbb480e78219.jpeg',
    IMAGE_URL: 'https://cdn.lokboxes.ai/cdn-cgi/image/quality=75,format=webp/flippop/image/item/story/1996218524934668288/202512040537/6b3b2b76167b42c6a7ecfbb480e78219.jpeg',
    JWT_HEADER: {
        alg: 'HS256',
        typ: 'JWT',
    },
    JWT_PAYLOAD: {
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
        exp: 1516242622,
    },
    JSON_OLD: {
        name: 'John',
        age: 30,
        city: 'New York',
        hobbies: ['reading', 'swimming'],
    },
    JSON_NEW: {
        name: 'John',
        age: 31,
        city: 'Los Angeles',
        hobbies: ['reading', 'coding'],
        job: 'Developer',
    },
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    FORMAT: 'Ctrl+Shift+F',
    ESCAPE: 'Escape',
} as const

// Accessibility
export const ARIA_LABELS = {
    CLOSE_MODAL: 'Close modal',
    COPY_TO_CLIPBOARD: 'Copy to clipboard',
    PASTE_FROM_CLIPBOARD: 'Paste from clipboard',
    CLEAR_INPUT: 'Clear input',
    TOGGLE_THEME: 'Toggle theme',
    SHOW_HISTORY: 'Show history',
    DELETE_HISTORY_ITEM: 'Delete history item',
    LOAD_HISTORY_ITEM: 'Load history item',
} as const
