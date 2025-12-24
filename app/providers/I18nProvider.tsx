'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { zhCN, enUS, type Locale, type LocaleKey, defaultLocale } from '@/locales'
import { STORAGE_KEYS } from '@/constants'

interface I18nContextValue {
    locale: LocaleKey
    t: Locale
    setLocale: (locale: LocaleKey) => void
}

const localeMap: Record<LocaleKey, Locale> = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<LocaleKey>(defaultLocale)
    const [t, setT] = useState<Locale>(localeMap[defaultLocale])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const savedLocale = localStorage.getItem(STORAGE_KEYS.LOCALE) as LocaleKey | null
        if (savedLocale && localeMap[savedLocale]) {
            setLocaleState(savedLocale)
            setT(localeMap[savedLocale])
        }
    }, [])

    const setLocale = useCallback((newLocale: LocaleKey) => {
        if (localeMap[newLocale]) {
            setLocaleState(newLocale)
            setT(localeMap[newLocale])
            localStorage.setItem(STORAGE_KEYS.LOCALE, newLocale)
        }
    }, [])

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo<I18nContextValue>(() => ({
        locale,
        t,
        setLocale
    }), [locale, t, setLocale])

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    )
}

export function useI18n() {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}
