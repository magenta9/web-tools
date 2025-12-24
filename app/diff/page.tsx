'use client'

import React, { useState } from 'react'
import {
  MinusCircle,
  Clipboard,
  Code,
  Trash,
  GitCompare,
  FileCode,
  Minus,
  Plus,
  Copy,
  Download
} from 'lucide-react'
import Layout from '../components/Layout'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { pasteFromClipboard, copyToClipboard } from '../utils'
import { EXAMPLES } from '@/constants'
import type { DiffLine, DiffStats, JsonObject } from '@/types'
import '../tools.css'

export default function JsonDiff() {
  const [oldJson, setOldJson] = useState('')
  const [newJson, setNewJson] = useState('')
  const [diffOutput, setDiffOutput] = useState<DiffLine[]>([])
  const [stats, setStats] = useState<DiffStats>({ added: 0, removed: 0 })
  const toast = useToastContext()
  const { t } = useI18n()

  const pasteOldJSON = async () => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      setOldJson(text)
      toast.success(t.toast.pasteSuccess)
    } else {
      toast.error(t.toast.pasteFailed)
    }
  }

  const pasteNewJSON = async () => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      setNewJson(text)
      toast.success(t.toast.pasteSuccess)
    } else {
      toast.error(t.toast.pasteFailed)
    }
  }

  const clearOldJSON = () => {
    setOldJson('')
    setDiffOutput([])
    setStats({ added: 0, removed: 0 })
  }

  const clearNewJSON = () => {
    setNewJson('')
    setDiffOutput([])
    setStats({ added: 0, removed: 0 })
  }

  const loadOldExample = () => {
    setOldJson(JSON.stringify(EXAMPLES.JSON_OLD, null, 2))
  }

  const loadNewExample = () => {
    setNewJson(JSON.stringify(EXAMPLES.JSON_NEW, null, 2))
  }

  const compareJSON = () => {
    if (!oldJson || !newJson) {
      toast.warning(t.diff.inputRequired)
      return
    }

    try {
      const oldObj = JSON.parse(oldJson) as JsonObject
      const newObj = JSON.parse(newJson) as JsonObject

      const diff = generateDiff(oldObj, newObj)
      const addedCount = countAdded(oldObj, newObj)
      const removedCount = countRemoved(oldObj, newObj)

      setDiffOutput(diff)
      setStats({ added: addedCount, removed: removedCount })
      toast.success(t.diff.compareSuccess)
    } catch {
      toast.error(t.diff.formatError)
    }
  }

  const generateDiff = (oldObj: JsonObject, newObj: JsonObject): DiffLine[] => {
    const diff: DiffLine[] = []

    // Find removed properties
    const removedKeys = Object.keys(oldObj).filter(key => !(key in newObj))
    removedKeys.forEach(key => {
      diff.push({ type: 'removed', key, oldValue: JSON.stringify(oldObj[key]) })
    })

    // Find added properties
    const addedKeys = Object.keys(newObj).filter(key => !(key in oldObj))
    addedKeys.forEach(key => {
      diff.push({ type: 'added', key, newValue: JSON.stringify(newObj[key]) })
    })

    // Find modified properties
    const commonKeys = Object.keys(oldObj).filter(key => key in newObj)
    commonKeys.forEach(key => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        diff.push({
          type: 'modified',
          key,
          oldValue: JSON.stringify(oldObj[key]),
          newValue: JSON.stringify(newObj[key])
        })
      }
    })

    if (diff.length === 0) {
      diff.push({ type: 'unchanged', key: '' })
    }

    return diff
  }

  const countAdded = (oldObj: JsonObject, newObj: JsonObject): number => {
    let count = 0
    const addedKeys = Object.keys(newObj).filter(key => !(key in oldObj))
    count += addedKeys.length

    const commonKeys = Object.keys(oldObj).filter(key => key in newObj)
    commonKeys.forEach(key => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        count++
      }
    })

    return count
  }

  const countRemoved = (oldObj: JsonObject, newObj: JsonObject): number => {
    let count = 0
    const removedKeys = Object.keys(oldObj).filter(key => !(key in newObj))
    count += removedKeys.length

    const commonKeys = Object.keys(oldObj).filter(key => key in newObj)
    commonKeys.forEach(key => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        count++
      }
    })

    return count
  }

  const diffToText = (): string => {
    return diffOutput.map(line => {
      if (line.type === 'unchanged') return t.diff.identical
      if (line.type === 'added') return `+ ${line.key}: ${line.newValue}`
      if (line.type === 'removed') return `- ${line.key}: ${line.oldValue}`
      return `~ ${line.key}:\n  - ${line.oldValue}\n  + ${line.newValue}`
    }).join('\n')
  }

  const copyDiff = async () => {
    if (diffOutput.length === 0) return
    const success = await copyToClipboard(diffToText())
    if (success) {
      toast.success(t.toast.copySuccess)
    } else {
      toast.error(t.toast.copyFailed)
    }
  }

  const downloadDiff = () => {
    if (diffOutput.length === 0) return
    const blob = new Blob([diffToText()], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'json-diff.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="json-diff">
        <div className="diff-container">
          <div className="panels">
            {/* Old JSON Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FileCode size={14} /> 原始 JSON
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={pasteOldJSON}>
                    <Clipboard size={14} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={loadOldExample}>
                    <Code size={14} /> 示例
                  </button>
                  <button className="panel-btn" onClick={clearOldJSON}>
                    <Trash size={14} /> 清空
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={oldJson}
                  onChange={(e) => setOldJson(e.target.value)}
                  className="code-textarea"
                  placeholder='输入原始 JSON 数据'
                />
              </div>
            </div>

            {/* New JSON Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FileCode size={14} /> 新的 JSON
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={pasteNewJSON}>
                    <Clipboard size={14} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={loadNewExample}>
                    <Code size={14} /> 示例
                  </button>
                  <button className="panel-btn" onClick={clearNewJSON}>
                    <Trash size={14} /> 清空
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={newJson}
                  onChange={(e) => setNewJson(e.target.value)}
                  className="code-textarea"
                  placeholder='输入新的 JSON 数据'
                />
              </div>
            </div>
          </div>

          {/* Compare Button */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button className="cyber-btn-small" onClick={compareJSON}>
              <GitCompare size={14} /> 对比 JSON
            </button>
          </div>

          {/* Diff Output */}
          {diffOutput.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <MinusCircle size={14} /> 对比结果
                  <span style={{ marginLeft: '20px', fontSize: '14px' }}>
                    <span style={{ color: '#22c55e' }}>
                      <Plus size={12} /> 新增: {stats.added}
                    </span>
                    <span style={{ marginLeft: '10px', color: '#ef4444' }}>
                      <Minus size={12} /> 删除: {stats.removed}
                    </span>
                  </span>
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={copyDiff}>
                    <Copy size={14} /> 复制
                  </button>
                  <button className="panel-btn" onClick={downloadDiff}>
                    <Download size={14} /> 下载
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <div className="diff-result">
                  {diffOutput.map((line, index) => {
                    if (line.type === 'unchanged') {
                      return (
                        <div key={index} className="diff-item diff-unchanged">
                          两个 JSON 对象完全相同
                        </div>
                      )
                    }
                    if (line.type === 'added') {
                      return (
                        <div key={index} className="diff-item diff-added">
                          <Plus size={12} /> {line.key}: {line.newValue}
                        </div>
                      )
                    }
                    if (line.type === 'removed') {
                      return (
                        <div key={index} className="diff-item diff-removed">
                          <Minus size={12} /> {line.key}: {line.oldValue}
                        </div>
                      )
                    }
                    return (
                      <div key={index} className="diff-item diff-modified">
                        <div className="diff-removed">
                          <Minus size={12} /> {line.key}: {line.oldValue}
                        </div>
                        <div className="diff-added">
                          <Plus size={12} /> {line.key}: {line.newValue}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
