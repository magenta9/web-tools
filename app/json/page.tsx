'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faIndent,
  faCompressArrowsAlt,
  faQuoteRight,
  faQuoteLeft,
  faMagic,
  faCopy,
  faPaste,
  faExchangeAlt,
  faSortAmountDown,
  faHistory,
  faTrashAlt,
  faTachometerAlt,
  faCode,
  faCheckCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard, formatBytes } from '../utils'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { DEBOUNCE_DELAY, STORAGE_KEYS } from '@/constants'
import { getErrorMessage } from '@/types'
import type { JsonValue, JsonObject, ValidationStatus } from '@/types'
import '../tools.css'

interface JsonHistoryItem {
  type: string
  input: string
  output: string
  timestamp: number
  mode: string
}

function sortObjectKeys(obj: JsonValue): JsonValue {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const sorted: JsonObject = {}
    Object.keys(obj as JsonObject)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys((obj as JsonObject)[key])
      })
    return sorted
  }
  return obj
}

export default function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState(2)
  const [sortKeys, setSortKeys] = useState(true)
  const [liveMode, setLiveMode] = useState(false)
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
  } = useHistory<JsonHistoryItem>({ storageKey: STORAGE_KEYS.JSON_HISTORY })
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('empty')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ input: 0, output: 0 })

  const liveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const addToHistory = useCallback((mode: string, inputText: string, outputText: string) => {
    saveToHistory({
      type: 'json_processing',
      input: inputText,
      output: outputText,
      mode: mode
    })
  }, [saveToHistory])

  const updateStats = useCallback(() => {
    setStats({
      input: input.length,
      output: output.length
    })
  }, [input, output])

  const validateJSON = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) {
      setValidationStatus('empty')
      setError('')
      return
    }

    try {
      JSON.parse(trimmed)
      setValidationStatus('valid')
      setError('')
    } catch (e) {
      setValidationStatus('invalid')
      setError((e as Error).message)
    }
  }, [input])

  const processJSON = useCallback((mode: string, silent = false) => {
    const raw = input.trim()
    if (!raw) {
      if (!silent) toast.warning(t.validation.required)
      return
    }

    try {
      let result = ''

      if (mode === 'escape') {
        result = JSON.stringify(raw)
      } else if (mode === 'unescape') {
        try {
          result = JSON.parse(raw)
          if (typeof result !== 'string') {
            result = JSON.stringify(result, null, indent)
          }
        } catch {
          result = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        }
      } else {
        let obj: JsonValue
        try {
          obj = JSON.parse(raw) as JsonValue
        } catch (e) {
          throw new Error(`${t.validation.invalidJson}: ${getErrorMessage(e)}`)
        }

        if (mode === 'format') {
          if (sortKeys) {
            obj = sortObjectKeys(obj)
          }
          result = JSON.stringify(obj, null, indent)
        } else if (mode === 'minify') {
          result = JSON.stringify(obj)
        }
      }

      setOutput(result)
      const operationMap: Record<string, string> = {
        format: t.json.formatSuccess,
        minify: t.json.minifySuccess,
      }
      if (!silent) {
        toast.success(operationMap[mode] || t.toast.operationSuccess)
        addToHistory(mode, raw, result)
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err)
      setError(errorMsg)
      if (!silent) {
        toast.error(`${t.json.processingFailed}: ${errorMsg}`)
      }
    }
  }, [input, indent, sortKeys, addToHistory, toast, t])

  const fixJSON = () => {
    const raw = input.trim()
    if (!raw) {
      toast.warning(t.validation.required)
      return
    }

    try {
      // Try to fix common JSON issues
      let fixed = raw

      // Replace single quotes with double quotes
      fixed = fixed.replace(/'/g, '"')

      // Add quotes around unquoted property names
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')

      // Remove trailing commas
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1')

      // Try to parse and re-stringify
      const obj = JSON.parse(fixed)
      const result = JSON.stringify(obj, null, indent)

      setOutput(result)
      setInput(fixed)
      toast.success(t.json.fixSuccess)
      addToHistory('fix', raw, result)
    } catch {
      toast.error(t.json.fixFailed)
    }
  }

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
    setValidationStatus('empty')
  }

  const swapInOut = () => {
    const temp = input
    setInput(output)
    setOutput(temp)
  }

  const loadFromHistory = (item: JsonHistoryItem) => {
    setInput(item.input)
    setOutput(item.output)
    hideHistory()
  }

  useEffect(() => {
    updateStats()
  }, [updateStats])

  useEffect(() => {
    updateStats()
    if (liveMode && input) {
      if (liveTimeoutRef.current) {
        clearTimeout(liveTimeoutRef.current)
      }
      liveTimeoutRef.current = setTimeout(() => {
        processJSON('format', true)
      }, 500)
    }
    validateJSON()
  }, [input, liveMode, processJSON, updateStats, validateJSON])

  useEffect(() => {
    updateStats()
  }, [output, updateStats])

  return (
    <Layout>
      <div className="json-tool">
        <div className="json-container">
          {/* Options Bar */}
          <div className="options-bar">
            <div className="option-group">
              <label className="option-label">
                <input
                  type="checkbox"
                  checked={sortKeys}
                  onChange={(e) => setSortKeys(e.target.checked)}
                />
                <FontAwesomeIcon icon={faSortAmountDown} /> 排序键
              </label>
              <label className="option-label">
                <input
                  type="checkbox"
                  checked={liveMode}
                  onChange={(e) => setLiveMode(e.target.checked)}
                />
                <FontAwesomeIcon icon={faTachometerAlt} /> 实时模式
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
                  <option value={0}>Tab</option>
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
                  <FontAwesomeIcon icon={faArrowRight} /> INPUT
                  {validationStatus !== 'empty' && (
                    <span className={`validation-indicator ${validationStatus}`}>
                      <FontAwesomeIcon icon={validationStatus === 'valid' ? faCheckCircle : faExclamationTriangle} />
                      {validationStatus === 'valid' ? '有效' : '无效'}
                    </span>
                  )}
                </div>
                <div className="panel-actions">
                  <button className="panel-btn format-btn" onClick={() => processJSON('format')}>
                    <FontAwesomeIcon icon={faIndent} /> FORMAT
                  </button>
                  <button className="panel-btn minify-btn" onClick={() => processJSON('minify')}>
                    <FontAwesomeIcon icon={faCompressArrowsAlt} /> MINIFY
                  </button>
                  <button className="panel-btn escape-btn" onClick={() => processJSON('escape')}>
                    <FontAwesomeIcon icon={faQuoteRight} /> ESCAPE
                  </button>
                  <button className="panel-btn unescape-btn" onClick={() => processJSON('unescape')}>
                    <FontAwesomeIcon icon={faQuoteLeft} /> UNESCAPE
                  </button>
                  <button className="panel-btn fix-btn" onClick={fixJSON}>
                    <FontAwesomeIcon icon={faMagic} /> FIX
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="code-textarea"
                  placeholder='输入 JSON 数据，例如: {"name": "John", "age": 30}'
                />
                {error && <div className="error-message">{error}</div>}
              </div>
              <div className="panel-footer">
                <div className="stats">
                  <span>{formatBytes(stats.input)} bytes</span>
                  <button className="panel-btn" onClick={showHistory}>
                    <FontAwesomeIcon icon={faHistory} /> 历史记录
                  </button>
                </div>
                <div className="action-buttons">
                  <button className="panel-btn" onClick={handlePaste}>
                    <FontAwesomeIcon icon={faPaste} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={clearAll}>
                    <FontAwesomeIcon icon={faTrashAlt} /> 清空
                  </button>
                </div>
              </div>
            </div>

            {/* Output Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FontAwesomeIcon icon={faCode} /> OUTPUT
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={swapInOut}>
                    <FontAwesomeIcon icon={faExchangeAlt} /> 交换
                  </button>
                  <button className="panel-btn" onClick={() => output && handleCopy(output)}>
                    <FontAwesomeIcon icon={faCopy} /> 复制
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={output}
                  readOnly
                  className="code-textarea output-textarea"
                  placeholder="处理后的 JSON 将显示在这里"
                />
              </div>
              <div className="panel-footer">
                <div className="stats">
                  <span>{formatBytes(stats.output)} bytes</span>
                </div>
                <div className="action-buttons">
                  <button className="panel-btn" onClick={() => output && handleCopy(output)}>
                    <FontAwesomeIcon icon={faCopy} /> 复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title="JSON 处理历史"
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