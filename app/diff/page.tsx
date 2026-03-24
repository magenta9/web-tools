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
import type { DiffLine, DiffStats, JsonValue } from '@/types'
import '../tools.css'

function deepDiff(oldVal: JsonValue, newVal: JsonValue, path: string): DiffLine[] {
  const diff: DiffLine[] = []

  // Both are objects (not arrays, not null)
  if (
    oldVal !== null && newVal !== null &&
    typeof oldVal === 'object' && typeof newVal === 'object' &&
    !Array.isArray(oldVal) && !Array.isArray(newVal)
  ) {
    const oldObj = oldVal as Record<string, JsonValue>
    const newObj = newVal as Record<string, JsonValue>
    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))

    for (const key of allKeys) {
      const childPath = path ? `${path}.${key}` : key
      if (!(key in oldObj)) {
        diff.push({ type: 'added', path: childPath, key, newValue: JSON.stringify(newObj[key], null, 2) })
      } else if (!(key in newObj)) {
        diff.push({ type: 'removed', path: childPath, key, oldValue: JSON.stringify(oldObj[key], null, 2) })
      } else {
        diff.push(...deepDiff(oldObj[key], newObj[key], childPath))
      }
    }
    return diff
  }

  // Both are arrays
  if (Array.isArray(oldVal) && Array.isArray(newVal)) {
    const maxLen = Math.max(oldVal.length, newVal.length)
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`
      if (i >= oldVal.length) {
        diff.push({ type: 'added', path: childPath, key: `[${i}]`, newValue: JSON.stringify(newVal[i], null, 2) })
      } else if (i >= newVal.length) {
        diff.push({ type: 'removed', path: childPath, key: `[${i}]`, oldValue: JSON.stringify(oldVal[i], null, 2) })
      } else {
        diff.push(...deepDiff(oldVal[i], newVal[i], childPath))
      }
    }
    return diff
  }

  // Leaf values (primitives or type mismatch)
  if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
    const normalizedPath = path === '' ? '(root)' : path
    const displayKey = path === '' ? '(root)' : (path.split('.').pop() || path)

    diff.push({
      type: 'modified',
      path: normalizedPath,
      key: displayKey,
      oldValue: JSON.stringify(oldVal, null, 2),
      newValue: JSON.stringify(newVal, null, 2),
    })
  }

  return diff
}

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
      const oldObj = JSON.parse(oldJson) as JsonValue
      const newObj = JSON.parse(newJson) as JsonValue

      const diff = deepDiff(oldObj, newObj, '')
      const addedCount = diff.filter(d => d.type === 'added').length
      const removedCount = diff.filter(d => d.type === 'removed').length

      setDiffOutput(diff.length > 0 ? diff : [{ type: 'unchanged', path: '', key: '' }])
      setStats({ added: addedCount, removed: removedCount })
      toast.success(t.diff.compareSuccess)
    } catch {
      toast.error(t.diff.formatError)
    }
  }

  const diffToText = (): string => {
    return diffOutput.map(line => {
      if (line.type === 'unchanged') return t.diff.identical
      const displayPath = line.path || line.key
      if (line.type === 'added') return `+ ${displayPath}: ${line.newValue}`
      if (line.type === 'removed') return `- ${displayPath}: ${line.oldValue}`
      return `~ ${displayPath}:\n  - ${line.oldValue}\n  + ${line.newValue}`
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

  const modifiedCount = diffOutput.filter(d => d.type === 'modified').length

  return (
    <Layout>
      <div className="json-diff">
        <div className="diff-container">
          <div className="panels">
            {/* Old JSON Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FileCode size={14} /> {t.diff.oldJson}
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={pasteOldJSON}>
                    <Clipboard size={14} /> {t.common.paste}
                  </button>
                  <button className="panel-btn" onClick={loadOldExample}>
                    <Code size={14} /> {t.common.example}
                  </button>
                  <button className="panel-btn" onClick={clearOldJSON}>
                    <Trash size={14} /> {t.common.clear}
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={oldJson}
                  onChange={(e) => setOldJson(e.target.value)}
                  className="code-textarea"
                  placeholder={t.diff.oldJson}
                />
              </div>
            </div>

            {/* New JSON Panel */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FileCode size={14} /> {t.diff.newJson}
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={pasteNewJSON}>
                    <Clipboard size={14} /> {t.common.paste}
                  </button>
                  <button className="panel-btn" onClick={loadNewExample}>
                    <Code size={14} /> {t.common.example}
                  </button>
                  <button className="panel-btn" onClick={clearNewJSON}>
                    <Trash size={14} /> {t.common.clear}
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <textarea
                  value={newJson}
                  onChange={(e) => setNewJson(e.target.value)}
                  className="code-textarea"
                  placeholder={t.diff.newJson}
                />
              </div>
            </div>
          </div>

          {/* Compare Button */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button className="cyber-btn-small" onClick={compareJSON}>
              <GitCompare size={14} /> {t.diff.compare}
            </button>
          </div>

          {/* Diff Output */}
          {diffOutput.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <MinusCircle size={14} /> {t.diff.result}
                  <span style={{ marginLeft: '20px', fontSize: '14px' }}>
                    <span style={{ color: '#22c55e' }}>
                      <Plus size={12} /> {t.diff.added}: {stats.added}
                    </span>
                    <span style={{ marginLeft: '10px', color: '#ef4444' }}>
                      <Minus size={12} /> {t.diff.removed}: {stats.removed}
                    </span>
                    <span style={{ marginLeft: '10px', color: '#fbbf24' }}>
                      ~ {t.diff.modified}: {modifiedCount}
                    </span>
                  </span>
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={copyDiff}>
                    <Copy size={14} /> {t.common.copy}
                  </button>
                  <button className="panel-btn" onClick={downloadDiff}>
                    <Download size={14} /> {t.common.download}
                  </button>
                </div>
              </div>
              <div className="panel-content">
                <div className="diff-result">
                  {diffOutput.map((line, index) => {
                    if (line.type === 'unchanged') {
                      return (
                        <div key={index} className="diff-item diff-unchanged">
                          {t.diff.identical}
                        </div>
                      )
                    }
                    if (line.type === 'added') {
                      return (
                        <div key={index} className="diff-item diff-added">
                          <Plus size={12} /> <span className="diff-path">{line.path}</span>: {line.newValue}
                        </div>
                      )
                    }
                    if (line.type === 'removed') {
                      return (
                        <div key={index} className="diff-item diff-removed">
                          <Minus size={12} /> <span className="diff-path">{line.path}</span>: {line.oldValue}
                        </div>
                      )
                    }
                    return (
                      <div key={index} className="diff-item diff-modified">
                        <div className="diff-modified-path">~ {line.path}</div>
                        <div className="diff-removed">
                          <Minus size={12} /> {line.oldValue}
                        </div>
                        <div className="diff-added">
                          <Plus size={12} /> {line.newValue}
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
