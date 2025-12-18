'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faCalendarAlt,
  faCopy,
  faPaste,
  faTrash,
  faHistory,
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard } from '../utils'
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
  const [results, setResults] = useState<any[]>([])
  const {
    history,
    historyVisible,
    saveToHistory,
    deleteHistoryItem,
    clearAllHistory,
    showHistory,
    hideHistory
  } = useHistory<TimestampHistoryItem>({ storageKey: 'timestamp_history' })

  const addToHistory = (type: TimestampHistoryItem['type'], input: string, output: string) => {
    saveToHistory({ type, input, output })
  }

  const convertTimestampToDate = () => {
    const ts = timestamp.trim()
    if (!ts) {
      alert('请输入时间戳')
      return
    }

    try {
      const num = parseInt(ts)
      if (isNaN(num)) {
        throw new Error('无效的时间戳')
      }

      const dateObj = new Date(num)
      if (isNaN(dateObj.getTime())) {
        throw new Error('无效的时间戳')
      }

      const conversions = [
        {
          label: 'UTC 时间',
          value: dateObj.toUTCString()
        },
        {
          label: '本地时间',
          value: dateObj.toLocaleString()
        },
        {
          label: 'ISO 8601',
          value: dateObj.toISOString()
        },
        {
          label: '日期 (YYYY-MM-DD)',
          value: dateObj.toISOString().split('T')[0]
        },
        {
          label: '时间 (HH:MM:SS)',
          value: dateObj.toTimeString().split(' ')[0]
        },
        {
          label: '中国时区 (UTC+8)',
          value: new Date(num + 8 * 60 * 60 * 1000).toLocaleString('zh-CN')
        }
      ]

      setResults(conversions)
      const output = conversions.map(c => `${c.label}: ${c.value}`).join('\n')
      addToHistory('timestamp_to_date', ts, output)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const convertDateToTimestamp = () => {
    const dateStr = date.trim()
    if (!dateStr) {
      alert('请输入日期')
      return
    }

    try {
      const dateObj = new Date(dateStr)
      if (isNaN(dateObj.getTime())) {
        throw new Error('无效的日期格式')
      }

      const conversions = [
        {
          label: 'Unix 时间戳 (秒)',
          value: Math.floor(dateObj.getTime() / 1000)
        },
        {
          label: 'Unix 时间戳 (毫秒)',
          value: dateObj.getTime()
        }
      ]

      setResults(conversions)
      const output = conversions.map(c => `${c.label}: ${c.value}`).join('\n')
      addToHistory('date_to_timestamp', dateStr, output)
    } catch (err) {
      alert((err as Error).message)
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
    alert(success ? '已复制到剪贴板' : '复制失败')
  }

  const handlePaste = async (type: 'timestamp' | 'date') => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      if (type === 'timestamp') {
        setTimestamp(text)
      } else {
        setDate(text)
      }
      alert('已粘贴')
    } else {
      alert('无法读取剪贴板')
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
        setDate(firstResult)
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
                  <FontAwesomeIcon icon={faClock} /> 时间戳转换
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={getCurrentTimestamp}>
                    当前时间戳
                  </button>
                  <button className="panel-btn" onClick={() => handlePaste('timestamp')}>
                    <FontAwesomeIcon icon={faPaste} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={() => setTimestamp('')}>
                    <FontAwesomeIcon icon={faTrash} /> 清空
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
                  <FontAwesomeIcon icon={faCalendarAlt} /> 转换为日期
                </button>
              </div>
            </div>

            {/* Date Input Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FontAwesomeIcon icon={faCalendarAlt} /> 日期转换
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={getCurrentDate}>
                    当前日期
                  </button>
                  <button className="panel-btn" onClick={() => handlePaste('date')}>
                    <FontAwesomeIcon icon={faPaste} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={() => setDate('')}>
                    <FontAwesomeIcon icon={faTrash} /> 清空
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
                  <FontAwesomeIcon icon={faClock} /> 转换为时间戳
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
                    <FontAwesomeIcon icon={faExchangeAlt} /> 交换输入输出
                  </button>
                  <button className="panel-btn" onClick={clearAll}>
                    <FontAwesomeIcon icon={faTrash} /> 清空全部
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
                        <FontAwesomeIcon icon={faCopy} /> 复制
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
              <FontAwesomeIcon icon={faHistory} /> 历史记录
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