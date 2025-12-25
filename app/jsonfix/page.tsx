'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowRight,
  Wand2,
  Copy,
  Clipboard,
  History,
  Trash2,
  Code,
  Settings,
  RefreshCcw,
  Loader2
} from 'lucide-react'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard, formatBytes } from '../utils'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { DEBOUNCE_DELAY, STORAGE_KEYS } from '@/constants'
import '../tools.css'

interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

const API_BASE = 'http://localhost:3001/api'

interface JsonFixHistoryItem {
  type: string
  input: string
  output: string
  timestamp: number
  mode: string
}

/**
 * Parse protobuf-style text to JSON object
 * Handles formats like:
 * - key:value (string values without quotes)
 * - key:"value" (quoted strings)
 * - key:123 (numbers)
 * - key:true/false (booleans)
 * - Nested objects with braces
 * - Arrays with brackets
 */
function parseProtobufStyle(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  let pos = 0

  const skipWhitespace = () => {
    while (pos < text.length && /\s/.test(text[pos])) pos++
  }

  const parseValue = (): unknown => {
    skipWhitespace()

    if (pos >= text.length) return undefined

    // Check for object
    if (text[pos] === '{') {
      return parseObject()
    }

    // Check for array
    if (text[pos] === '[') {
      return parseArray()
    }

    // Check for quoted string
    if (text[pos] === '"') {
      pos++
      let str = ''
      while (pos < text.length && text[pos] !== '"') {
        if (text[pos] === '\\' && pos + 1 < text.length) {
          pos++
          const next = text[pos]
          if (next === 'n') str += '\n'
          else if (next === 't') str += '\t'
          else if (next === 'r') str += '\r'
          else if (next === '\\') str += '\\'
          else if (next === '"') str += '"'
          else str += next
        } else {
          str += text[pos]
        }
        pos++
      }
      pos++ // skip closing quote
      return str
    }

    // Check for unquoted value (boolean, number, or identifier)
    const start = pos
    while (pos < text.length && !/[{}\[\]:,\s]/.test(text[pos])) {
      pos++
    }
    const value = text.slice(start, pos).trim()

    if (!value) return undefined

    // Boolean
    if (value === 'true') return true
    if (value === 'false') return false

    // Null
    if (value === 'null' || value === 'NULL') return null

    // Number
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
      const num = Number(value)
      return Number.isInteger(num) ? num : num
    }

    // Return as string for unquoted identifiers (like enum values)
    return value
  }

  const parseObject = (): Record<string, unknown> => {
    const obj: Record<string, unknown> = {}
    skipWhitespace()

    if (text[pos] === '{') pos++ // skip opening brace

    while (pos < text.length) {
      skipWhitespace()

      if (text[pos] === '}') {
        pos++
        break
      }

      if (text[pos] === ',') {
        pos++
        continue
      }

      // Parse key
      const keyStart = pos
      while (pos < text.length && !/[{}\[\]:,\s]/.test(text[pos])) {
        // Handle quoted keys
        if (text[pos] === '"') {
          pos++
          while (pos < text.length && text[pos] !== '"') {
            if (text[pos] === '\\' && pos + 1 < text.length) pos++
            pos++
          }
        }
        pos++
      }
      let key = text.slice(keyStart, pos).trim()
      // Remove quotes from key if present
      if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1).replace(/\\(.)/g, '$1')
      }

      skipWhitespace()

      // Skip colon
      if (text[pos] === ':') pos++

      // Parse value
      const value = parseValue()

      if (key) {
        obj[key] = value
      }
    }

    return obj
  }

  const parseArray = (): unknown[] => {
    const arr: unknown[] = []
    skipWhitespace()

    if (text[pos] === '[') pos++ // skip opening bracket

    while (pos < text.length) {
      skipWhitespace()

      if (text[pos] === ']') {
        pos++
        break
      }

      if (text[pos] === ',') {
        pos++
        continue
      }

      arr.push(parseValue())
    }

    return arr
  }

  // If the whole text is an object
  skipWhitespace()
  if (text[pos] === '{') {
    return parseObject()
  }

  // Otherwise try to parse as a flat structure (key:value pairs at root)
  skipWhitespace()
  while (pos < text.length) {
    if (text[pos] === '{' || text[pos] === '[') break

    const keyStart = pos
    while (pos < text.length && !/[{}\[\]:,\s]/.test(text[pos])) {
      if (text[pos] === '"') {
        pos++
        while (pos < text.length && text[pos] !== '"') {
          if (text[pos] === '\\' && pos + 1 < text.length) pos++
          pos++
        }
      }
      pos++
    }
    let key = text.slice(keyStart, pos).trim()
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.slice(1, -1).replace(/\\(.)/g, '$1')
    }

    if (!key) {
      pos++
      continue
    }

    skipWhitespace()

    if (text[pos] === ':') pos++
    else break

    const value = parseValue()
    if (key) {
      result[key] = value
    }
  }

  return result
}

export default function JsonFixTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState(2)
  const toast = useToastContext()
  const { t } = useI18n()
  const {
    history,
    historyVisible,
    saveToHistory,
    deleteHistoryItem,
    clearAllHistory,
    showHistory,
    hideHistory
  } = useHistory<JsonFixHistoryItem>({ storageKey: STORAGE_KEYS.JSONFIX_HISTORY })
  const [error, setError] = useState('')
  const liveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ollama models state
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('llama3.2')
  const [isGenerating, setIsGenerating] = useState(false)

  const addToHistory = useCallback((mode: string, inputText: string, outputText: string) => {
    saveToHistory({
      type: 'jsonfix_processing',
      input: inputText,
      output: outputText,
      mode: mode
    })
  }, [saveToHistory])

  const fixJson = useCallback((mode: string, silent = false) => {
    const raw = input.trim()
    if (!raw) {
      if (!silent) toast.warning(t.validation.required)
      return
    }

    try {
      const parsed = parseProtobufStyle(raw)
      const result = JSON.stringify(parsed, null, indent)

      setOutput(result)
      setError('')

      if (!silent) {
        toast.success(t.jsonfix.success)
        addToHistory(mode, raw, result)
      }
    } catch (err) {
      const errorMsg = (err as Error).message
      setError(errorMsg)
      if (!silent) {
        toast.error(`${t.jsonfix.failed}: ${errorMsg}`)
      }
    }
  }, [input, indent, addToHistory, toast, t])

  // Live mode with debounce
  const [liveMode, setLiveMode] = useState(false)

  // Load models from Ollama
  useEffect(() => {
    let mounted = true

    const loadModels = async () => {
      try {
        const res = await fetch(`${API_BASE}/ollama/models`)
        const data = await res.json()
        if (mounted && data.success && data.models) {
          setModels(data.models)
          if (data.models.length > 0) {
            const currentModelAvailable = data.models.some((m: OllamaModel) => m.name === selectedModel)
            if (!currentModelAvailable) {
              setSelectedModel(data.models[0].name)
            }
          }
        }
      } catch {
        // Ollama might not be running
      }
    }

    loadModels()

    return () => {
      mounted = false
    }
  }, [])

  // AI-powered JSON fix
  const fixJsonWithAI = async () => {
    const raw = input.trim()
    if (!raw) {
      toast.warning(t.validation.required)
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/ollama/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You must output ONLY valid JSON. No markdown, no explanation, no text whatsoever.

Input:
${raw}

Output (pure JSON only, nothing else):`,
          model: selectedModel
        })
      })
      const data = await res.json()

      if (data.success) {
        // 清理输出，移除 markdown 代码块
        let cleanedOutput = data.response.trim()
        cleanedOutput = cleanedOutput.replace(/^```json\s*/gi, '')
        cleanedOutput = cleanedOutput.replace(/^```\s*/gm, '')
        cleanedOutput = cleanedOutput.replace(/\s*```$/gm, '')

        // 验证是否是有效 JSON
        try {
          const parsed = JSON.parse(cleanedOutput)
          const formattedOutput = JSON.stringify(parsed, null, indent)
          setOutput(formattedOutput)
          toast.success(t.jsonfix.success)
          addToHistory('ai', raw, formattedOutput)
        } catch {
          toast.error(t.jsonfix.invalidOutput)
        }
      } else {
        toast.error(`AI fix failed: ${data.error}`)
      }
    } catch {
      toast.error('Failed to connect to AI service')
    } finally {
      setIsGenerating(false)
    }
  }

  React.useEffect(() => {
    if (!liveMode || !input) {
      if (liveTimeoutRef.current) {
        clearTimeout(liveTimeoutRef.current)
        liveTimeoutRef.current = null
      }
      return
    }

    if (liveTimeoutRef.current) {
      clearTimeout(liveTimeoutRef.current)
    }

    liveTimeoutRef.current = setTimeout(() => {
      fixJson('auto', true)
    }, DEBOUNCE_DELAY.LIVE_MODE)

    return () => {
      if (liveTimeoutRef.current) {
        clearTimeout(liveTimeoutRef.current)
      }
    }
  }, [input, liveMode, fixJson])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (liveTimeoutRef.current) {
        clearTimeout(liveTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success(t.toast.copySuccess)
    } else {
      toast.error(t.toast.copyFailed)
    }
  }

  const handlePaste = async () => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      setInput(text)
      toast.success(t.toast.pasteSuccess)
    } else {
      toast.error(t.toast.pasteFailed)
    }
  }

  const clearAll = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const swapInOut = () => {
    const temp = input
    setInput(output)
    setOutput(temp)
  }

  const loadFromHistory = (item: JsonFixHistoryItem) => {
    setInput(item.input)
    setOutput(item.output)
    hideHistory()
  }

  return (
    <Layout>
      <div className="jsonfix-tool">
        <div className="jsonfix-container">
          {/* Options Bar */}
          <div className="options-bar">
            <div className="option-group">
              <label className="option-label">
                <input
                  type="checkbox"
                  checked={liveMode}
                  onChange={(e) => setLiveMode(e.target.checked)}
                />
                <Settings size={14} /> 实时模式
              </label>
            </div>
            <div className="option-group">
              <label className="option-label">
                模型:
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="model-select"
                >
                  {models.length === 0 && (
                    <option value="llama3.2">llama3.2</option>
                  )}
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="option-group">
              <label className="option-label">
                缩进:
                <select
                  value={indent}
                  onChange={(e) => setIndent(Number(e.target.value))}
                  className="indent-select"
                >
                  <option value={2}>2 空格</option>
                  <option value={4}>4 空格</option>
                  <option value={0}>无</option>
                </select>
              </label>
            </div>
          </div>

          {/* Input/Output Panels */}
          <div className="panels">
            {/* Input Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <ArrowRight size={14} /> INPUT
                </div>
                <div className="panel-actions">
                                    <button
                    className="panel-btn ai-btn"
                    onClick={fixJsonWithAI}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                    AI 修复
                  </button>
                  <button className="panel-btn" onClick={() => fixJson('retry')}>
                    <RefreshCcw size={14} /> 重试
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="code-textarea"
                  placeholder='输入 protobuf 风格或非标准 JSON 数据，例如: {key:value key2:"value2"}'
                />
                {error && <div className="error-message">{error}</div>}
              </div>
              <div className="panel-footer">
                <div className="stats">
                  <span>{formatBytes(input.length)} bytes</span>
                  <button className="panel-btn" onClick={showHistory}>
                    <History size={14} /> 历史记录
                  </button>
                </div>
                <div className="action-buttons">
                  <button className="panel-btn" onClick={handlePaste}>
                    <Clipboard size={14} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={clearAll}>
                    <Trash2 size={14} /> 清空
                  </button>
                </div>
              </div>
            </div>

            {/* Output Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Code size={14} /> OUTPUT
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={swapInOut}>
                    <RefreshCcw size={14} /> 交换
                  </button>
                  <button className="panel-btn" onClick={() => output && handleCopy(output)}>
                    <Copy size={14} /> 复制
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={output}
                  readOnly
                  className="code-textarea output-textarea"
                  placeholder="修复后的标准 JSON 将显示在这里"
                />
              </div>
              <div className="panel-footer">
                <div className="stats">
                  <span>{formatBytes(output?.length || 0)} bytes</span>
                </div>
                <div className="action-buttons">
                  <button className="panel-btn" onClick={() => output && handleCopy(output)}>
                    <Copy size={14} /> 复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title="JSON 修复历史"
          history={history}
          onClose={hideHistory}
          onClearAll={clearAllHistory}
          onDelete={deleteHistoryItem}
          onLoad={loadFromHistory}
          renderItemLabel={(item) => item.mode.toUpperCase()}
          renderItemPreview={(item) => item.input.length > 200 ? item.input.substring(0, 200) + '...' : item.input}
        />
      </div>
    </Layout>
  )
}
