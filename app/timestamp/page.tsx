'use client'

import React, { useState } from 'react'
import {
  Clock,
  Calendar,
  Copy,
  Clipboard,
  Trash,
  History,
  ArrowLeftRight
} from 'lucide-react'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard } from '../utils'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { STORAGE_KEYS, TIMEZONE_OFFSETS, TIME_MS } from '@/constants'
import { getErrorMessage } from '@/types'
import type { ConversionResult } from '@/types'
import '../tools.css'

interface TimestampHistoryItem {
  type: 'timestamp_to_date' | 'date_to_timestamp'
  input: string
  output: string
  timestamp: number
}

export default function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('')
  const [date, setDate] = useState('')
  const [results, setResults] = useState<ConversionResult[]>([])
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
  } = useHistory<TimestampHistoryItem>({ storageKey: STORAGE_KEYS.TIMESTAMP_HISTORY })

  const addToHistory = (type: TimestampHistoryItem['type'], input: string, output: string) => {
    saveToHistory({ type, input, output })
  }

  const convertTimestampToDate = () => {
    const ts = timestamp.trim()
    if (!ts) {
      toast.warning(t.validation.required)
      return
    }

    try {
      const num = parseInt(ts)
      if (isNaN(num)) {
        throw new Error(t.validation.invalidTimestamp)
      }

      const dateObj = new Date(num)
      if (isNaN(dateObj.getTime())) {
        throw new Error(t.validation.invalidTimestamp)
      }

      const conversions: ConversionResult[] = [
        {
          label: t.timestamp.utcTime,
          value: dateObj.toUTCString()
        },
        {
          label: t.timestamp.localTime,
          value: dateObj.toLocaleString()
        },
        {
          label: t.timestamp.iso8601,
          value: dateObj.toISOString()
        },
        {
          label: t.timestamp.dateFormat,
          value: dateObj.toISOString().split('T')[0]
        },
        {
          label: t.timestamp.timeFormat,
          value: dateObj.toTimeString().split(' ')[0]
        },
        {
          label: t.timestamp.chinaTimezone,
          value: new Date(num + TIMEZONE_OFFSETS.CHINA * TIME_MS.HOUR).toLocaleString('zh-CN')
        }
      ]

      setResults(conversions)
      const output = conversions.map(c => `${c.label}: ${c.value}`).join('\n')
      addToHistory('timestamp_to_date', ts, output)
      toast.success(t.toast.operationSuccess)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const convertDateToTimestamp = () => {
    const dateStr = date.trim()
    if (!dateStr) {
      toast.warning(t.validation.required)
      return
    }

    try {
      const dateObj = new Date(dateStr)
      if (isNaN(dateObj.getTime())) {
        throw new Error(t.validation.invalidDate)
      }

      const conversions: ConversionResult[] = [
        {
          label: t.timestamp.unixSeconds,
          value: Math.floor(dateObj.getTime() / TIME_MS.SECOND)
        },
        {
          label: t.timestamp.unixMilliseconds,
          value: dateObj.getTime()
        }
      ]

      setResults(conversions)
      const output = conversions.map(c => `${c.label}: ${c.value}`).join('\n')
      addToHistory('date_to_timestamp', dateStr, output)
      toast.success(t.toast.operationSuccess)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const getCurrentTimestamp = () => {
    const now = new Date()
    setTimestamp(Math.floor(now.getTime() / 1000).toString())
  }

  const getCurrentDate = () => {
    const now = new Date()
    setDate(now.toISOString())
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success(t.toast.copySuccess)
    } else {
      toast.error(t.toast.copyFailed)
    }
  }

  const handlePaste = async (type: 'timestamp' | 'date') => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      if (type === 'timestamp') {
        setTimestamp(text)
      } else {
        setDate(text)
      }
      toast.success(t.toast.pasteSuccess)
    } else {
      toast.error(t.toast.pasteFailed)
    }
  }

  const clearAll = () => {
    setTimestamp('')
    setDate('')
    setResults([])
  }

  const swapInputOutput = () => {
    if (results.length > 0) {
      const firstResult = results[0].value
      if (results[0].label.includes('时间戳')) {
        setTimestamp(firstResult.toString())
        setDate('')
      } else {
        setDate(firstResult.toString())
        setTimestamp('')
      }
    }
  }

  const loadFromHistory = (item: TimestampHistoryItem) => {
    if (item.type === 'timestamp_to_date') {
      setTimestamp(item.input)
    } else {
      setDate(item.input)
    }
    hideHistory()
  }

  return (
    <Layout>
      <div className="timestamp-converter">
        <div className="timestamp-container">
          <div className="panels">
            {/* Timestamp Input Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Clock size={14} /> 时间戳转换
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={getCurrentTimestamp}>
                    当前时间戳
                  </button>
                  <button className="panel-btn" onClick={() => handlePaste('timestamp')}>
                    <Clipboard size={14} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={() => setTimestamp('')}>
                    <Trash size={14} /> 清空
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  placeholder="输入 Unix 时间戳 (秒或毫秒)"
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <button className="cyber-btn-small" onClick={convertTimestampToDate}>
                  <Calendar size={14} /> 转换为日期
                </button>
              </div>
            </div>

            {/* Date Input Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Calendar size={14} /> 日期转换
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={getCurrentDate}>
                    当前日期
                  </button>
                  <button className="panel-btn" onClick={() => handlePaste('date')}>
                    <Clipboard size={14} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={() => setDate('')}>
                    <Trash size={14} /> 清空
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="输入日期 (支持多种格式)"
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <button className="cyber-btn-small" onClick={convertDateToTimestamp}>
                  <Clock size={14} /> 转换为时间戳
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="panel" style={{ marginTop: '20px' }}>
              <div className="panel-header">
                <div className="panel-title">
                  转换结果
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={swapInputOutput}>
                    <ArrowLeftRight size={14} /> 交换输入输出
                  </button>
                  <button className="panel-btn" onClick={clearAll}>
                    <Trash size={14} /> 清空全部
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <div className="timestamp-grid">
                  {results.map((result, index) => (
                    <div key={index} className="timestamp-result">
                      <div className="timestamp-label">{result.label}</div>
                      <div className="timestamp-value">{result.value}</div>
                      <button
                        className="panel-btn"
                        onClick={() => handleCopy(result.value.toString())}
                        style={{ marginTop: '8px' }}
                      >
                        <Copy size={14} /> 复制
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History Button */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              className="panel-btn"
              onClick={showHistory}
            >
              <History size={14} /> 历史记录
            </button>
          </div>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title="转换历史"
          history={history}
          onClose={hideHistory}
          onClearAll={clearAllHistory}
          onDelete={deleteHistoryItem}
          onLoad={loadFromHistory}
          renderItemLabel={(item) => item.type === 'timestamp_to_date' ? '时间戳 → 日期' : '日期 → 时间戳'}
          renderItemPreview={(item) => `输入: ${item.input}`}
        />
      </div>
    </Layout>
  )
}
