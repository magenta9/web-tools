'use client'

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Languages, ArrowRightLeft, Copy, Loader2 } from 'lucide-react'
import '../tools.css'

const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
]

const translationStyles = [
    { code: 'standard', name: '标准', description: '准确、自然的翻译' },
    { code: 'casual', name: '日常', description: '口语化、轻松的表达' },
    { code: 'formal', name: '严谨', description: '正式、专业的用词' }
]

export default function TranslatePage() {
    const [sourceText, setSourceText] = useState('')
    const [translatedText, setTranslatedText] = useState('')
    const [sourceLang, setSourceLang] = useState('zh')
    const [targetLang, setTargetLang] = useState('en')
    const [style, setStyle] = useState('standard')
    const [selectedModel, setSelectedModel] = useState('llama3.2')
    const [availableModels, setAvailableModels] = useState<any[]>([])
    const [isTranslating, setIsTranslating] = useState(false)
    const [error, setError] = useState('')

    // Load available models on component mount
    useEffect(() => {
        let mounted = true

        const loadModels = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/ollama/models')
                if (!response.ok) throw new Error('Network response was not ok')
                const data = await response.json()
                if (mounted && data.success && data.models) {
                    setAvailableModels(data.models)
                    // Only set selected model if current one is not in the list
                    if (data.models.length > 0 && !data.models.find((m: any) => m.name === selectedModel)) {
                        setSelectedModel(data.models[0].name)
                    }
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to load models:', err)
                    // Set default model if API fails
                    setAvailableModels([{ name: 'llama3.2' }])
                }
            }
        }

        loadModels()

        return () => {
            mounted = false
        }
    }, [])

    const handleTranslate = async () => {
        if (!sourceText.trim()) return

        setIsTranslating(true)
        setError('')
        setTranslatedText('')

        try {
            const response = await fetch('http://localhost:3001/api/ollama/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: sourceText,
                    sourceLang,
                    targetLang,
                    style,
                    model: selectedModel
                })
            })

            const data = await response.json()

            if (data.success) {
                setTranslatedText(data.translation)
            } else {
                setError(data.error || '翻译失败')
            }
        } catch (err) {
            setError('网络错误，请重试')
        } finally {
            setIsTranslating(false)
        }
    }

    const swapLanguages = () => {
        setSourceLang(targetLang)
        setTargetLang(sourceLang)
        setSourceText(translatedText)
        setTranslatedText('')
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch (err) {
            console.error('Failed to copy text:', err)
        }
    }

    const getLanguageName = (code: string) => {
        return languages.find(lang => lang.code === code)?.name || code
    }

    const getLanguageFlag = (code: string) => {
        return languages.find(lang => lang.code === code)?.flag || ''
    }

    return (
        <Layout>
            <div className="translate-tool">
                {/* Translation Controls */}
                <div className="config-section">
                    <div className="config-panel">
                        <div className="config-header">
                            <h3>翻译设置</h3>
                        </div>
                        <div className="config-content">
                            <div className="config-row">
                                <div className="config-group">
                                    <label>源语言</label>
                                    <select
                                        value={sourceLang}
                                        onChange={(e) => setSourceLang(e.target.value)}
                                        className="config-select"
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.flag} {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    className="swap-btn"
                                    onClick={swapLanguages}
                                    title="交换语言"
                                >
                                    <ArrowRightLeft size={16} />
                                </button>

                                <div className="config-group">
                                    <label>目标语言</label>
                                    <select
                                        value={targetLang}
                                        onChange={(e) => setTargetLang(e.target.value)}
                                        className="config-select"
                                    >
                                        {languages.map(lang => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.flag} {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="config-group">
                                    <label>翻译风格</label>
                                    <div className="style-tabs">
                                        {translationStyles.map(styleOption => (
                                            <button
                                                key={styleOption.code}
                                                className={`style-tab ${style === styleOption.code ? 'active' : ''}`}
                                                onClick={() => setStyle(styleOption.code)}
                                                title={styleOption.description}
                                            >
                                                {styleOption.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Translation Area */}
                <div className="query-area">
                    {/* Input Panel */}
                    <div className="panel natural-input-panel">
                        <div className="panel-header">
                            <div className="panel-title input">
                                <Languages size={14} />
                                <span>输入文本 - {getLanguageFlag(sourceLang)} {getLanguageName(sourceLang)}</span>
                            </div>
                            <div className="panel-actions model-select-wrapper">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="header-model-select"
                                >
                                    {availableModels.length === 0 && (
                                        <option value="llama3.2">llama3.2</option>
                                    )}
                                    {availableModels.map((model: any) => (
                                        <option key={model.name} value={model.name}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="panel-btn"
                                    onClick={() => setSourceText('')}
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="panel-content">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                className="query-textarea"
                                placeholder="请输入要翻译的文本..."
                            />
                        </div>
                        <div className="panel-footer">
                            <span className="char-count">{sourceText.length} 字符</span>
                            <button
                                className="action-btn generate-btn"
                                onClick={handleTranslate}
                                disabled={!sourceText.trim() || isTranslating || sourceLang === targetLang}
                            >
                                {isTranslating ? (
                                    <>
                                        <Loader2 size={14} className="spin" />
                                        <span>翻译中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Languages size={14} />
                                        <span>翻译</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Output Panel */}
                    <div className="panel sql-output-panel">
                        <div className="panel-header">
                            <div className="panel-title output">
                                <Languages size={14} />
                                <span>翻译结果 - {getLanguageFlag(targetLang)} {getLanguageName(targetLang)}</span>
                            </div>
                            <div className="panel-actions">
                                <button
                                    className="panel-btn"
                                    onClick={() => copyToClipboard(translatedText)}
                                    disabled={!translatedText}
                                    title="复制"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="panel-content">
                            {error ? (
                                <div className="error-message">
                                    {error}
                                </div>
                            ) : (
                                <textarea
                                    value={translatedText}
                                    readOnly
                                    className="sql-textarea"
                                    placeholder="翻译结果将显示在这里..."
                                />
                            )}
                        </div>
                        <div className="panel-footer">
                            <span className="char-count">{translatedText.length} 字符</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}
