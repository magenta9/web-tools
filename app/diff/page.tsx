'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMinusCircle,
  faPlusCircle,
  faPaste,
  faCode,
  faTrash,
  faCodeCompare,
  faFileCode,
  faMinus,
  faPlus,
  faCopy,
  faDownload
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/Layout'
import '../tools.css'

interface DiffLine {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  key: string
  oldValue?: string
  newValue?: string
}

export default function JsonDiff() {
  const [oldJson, setOldJson] = useState('')
  const [newJson, setNewJson] = useState('')
  const [diffOutput, setDiffOutput] = useState<DiffLine[]>([])
  const [stats, setStats] = useState({ added: 0, removed: 0 })

  const pasteOldJSON = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setOldJson(text)
      alert('已粘贴')
    } catch (err) {
      alert('无法读取剪贴板')
    }
  }

  const pasteNewJSON = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setNewJson(text)
      alert('已粘贴')
    } catch (err) {
      alert('无法读取剪贴板')
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
    setOldJson(JSON.stringify({
      "name": "John",
      "age": 30,
      "city": "New York",
      "hobbies": ["reading", "swimming"]
    }, null, 2))
  }

  const loadNewExample = () => {
    setNewJson(JSON.stringify({
      "name": "John",
      "age": 31,
      "city": "Los Angeles",
      "hobbies": ["reading", "coding"],
      "job": "Developer"
    }, null, 2))
  }

  const compareJSON = () => {
    if (!oldJson || !newJson) {
      alert('请输入两个 JSON 对象')
      return
    }

    try {
      const oldObj = JSON.parse(oldJson)
      const newObj = JSON.parse(newJson)

      const diff = generateDiff(oldObj, newObj)
      const addedCount = countAdded(oldObj, newObj)
      const removedCount = countRemoved(oldObj, newObj)

      setDiffOutput(diff)
      setStats({ added: addedCount, removed: removedCount })
      alert('对比完成')
    } catch (err) {
      alert('JSON 格式错误')
    }
  }

  const generateDiff = (oldObj: any, newObj: any): DiffLine[] => {
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

  const countAdded = (oldObj: any, newObj: any): number => {
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

  const countRemoved = (oldObj: any, newObj: any): number => {
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
      if (line.type === 'unchanged') return '两个 JSON 对象完全相同'
      if (line.type === 'added') return `+ ${line.key}: ${line.newValue}`
      if (line.type === 'removed') return `- ${line.key}: ${line.oldValue}`
      return `~ ${line.key}:\n  - ${line.oldValue}\n  + ${line.newValue}`
    }).join('\n')
  }

  const copyDiff = async () => {
    if (diffOutput.length === 0) return
    try {
      await navigator.clipboard.writeText(diffToText())
      alert('已复制差异结果')
    } catch (err) {
      alert('复制失败')
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
                  <FontAwesomeIcon icon={faFileCode} /> 原始 JSON
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={pasteOldJSON}>
                    <FontAwesomeIcon icon={faPaste} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={loadOldExample}>
                    <FontAwesomeIcon icon={faCode} /> 示例
                  </button>
                  <button className="panel-btn" onClick={clearOldJSON}>
                    <FontAwesomeIcon icon={faTrash} /> 清空
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
                  <FontAwesomeIcon icon={faFileCode} /> 新的 JSON
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={pasteNewJSON}>
                    <FontAwesomeIcon icon={faPaste} /> 粘贴
                  </button>
                  <button className="panel-btn" onClick={loadNewExample}>
                    <FontAwesomeIcon icon={faCode} /> 示例
                  </button>
                  <button className="panel-btn" onClick={clearNewJSON}>
                    <FontAwesomeIcon icon={faTrash} /> 清空
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
              <FontAwesomeIcon icon={faCodeCompare} /> 对比 JSON
            </button>
          </div>

          {/* Diff Output */}
          {diffOutput.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FontAwesomeIcon icon={faMinusCircle} /> 对比结果
                  <span style={{ marginLeft: '20px', fontSize: '14px' }}>
                    <span style={{ color: '#22c55e' }}>
                      <FontAwesomeIcon icon={faPlus} /> 新增: {stats.added}
                    </span>
                    <span style={{ marginLeft: '10px', color: '#ef4444' }}>
                      <FontAwesomeIcon icon={faMinus} /> 删除: {stats.removed}
                    </span>
                  </span>
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={copyDiff}>
                    <FontAwesomeIcon icon={faCopy} /> 复制
                  </button>
                  <button className="panel-btn" onClick={downloadDiff}>
                    <FontAwesomeIcon icon={faDownload} /> 下载
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
                          <FontAwesomeIcon icon={faPlus} /> {line.key}: {line.newValue}
                        </div>
                      )
                    }
                    if (line.type === 'removed') {
                      return (
                        <div key={index} className="diff-item diff-removed">
                          <FontAwesomeIcon icon={faMinus} /> {line.key}: {line.oldValue}
                        </div>
                      )
                    }
                    return (
                      <div key={index} className="diff-item diff-modified">
                        <div className="diff-removed">
                          <FontAwesomeIcon icon={faMinus} /> {line.key}: {line.oldValue}
                        </div>
                        <div className="diff-added">
                          <FontAwesomeIcon icon={faPlus} /> {line.key}: {line.newValue}
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