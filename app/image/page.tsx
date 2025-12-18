'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKey,
  faLink,
  faSync,
  faSearch,
  faCopy,
  faPaste,
  faCode,
  faCheck,
  faArrowUp,
  faHistory
} from '@fortawesome/free-solid-svg-icons'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard, formatBytes } from '../utils'
import '../tools.css'

interface UrlItem {
  label: string
  url: string
  icon: string
}

interface ImageHistoryItem {
  type: 'key_to_url' | 'url_to_key'
  input: string
  output: string
  timestamp: number
}

export default function ImageConverter() {
  const [activeTab, setActiveTab] = useState<'key-to-url' | 'url-to-key'>('key-to-url')
  const [keyInput, setKeyInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlOutput, setUrlOutput] = useState<UrlItem[]>([])
  const [keyOutput, setKeyOutput] = useState('')
  const {
    history,
    historyVisible,
    saveToHistory,
    deleteHistoryItem,
    clearAllHistory,
    showHistory,
    hideHistory
  } = useHistory<ImageHistoryItem>({ storageKey: 'image_history' })

  const addToHistory = (type: ImageHistoryItem['type'], input: string, output: string) => {
    saveToHistory({ type, input, output })
  }

  const convertKeyToUrls = () => {
    const key = keyInput.trim()
    if (!key) {
      alert('请输入 Image Key')
      return
    }

    const baseCDN = 'https://cdn.lokboxes.ai/'
    const frenchCDN = 'https://cdn.flippop.fun/'

    const urls: UrlItem[] = [
      { label: 'Original CDN', url: baseCDN + key, icon: 'globe' },
      { label: 'French CDN', url: frenchCDN + key, icon: 'flag' },
      { label: 'Optimized (WebP, Quality 75)', url: baseCDN + 'cdn-cgi/image/quality=75,format=webp/' + key, icon: 'compress' },
      { label: 'Optimized (Width 400, Quality 75)', url: baseCDN + 'cdn-cgi/image/width=400,quality=75/' + key, icon: 'expand-arrows-alt' },
      { label: 'Optimized (Width 800, Quality 85)', url: baseCDN + 'cdn-cgi/image/width=800,quality=85/' + key, icon: 'tv' }
    ]

    setUrlOutput(urls)
    const outputText = urls.map(u => u.url).join('\n')
    addToHistory('key_to_url', key, outputText)
    alert('转换成功')
  }

  const extractKeyFromUrl = () => {
    const url = urlInput.trim()
    if (!url) {
      alert('请输入 URL')
      return
    }

    try {
      let key = url

      // Remove protocol and domain
      key = key.replace(/^https?:\/\//, '')
      const firstSlash = key.indexOf('/')
      if (firstSlash !== -1) {
        key = key.substring(firstSlash + 1)
      }

      // Remove cdn-cgi/image processing
      if (key.includes('cdn-cgi/image/')) {
        const parts = key.split('/')
        const cgIndex = parts.findIndex(p => p.includes('cdn-cgi'))
        if (cgIndex !== -1) {
          key = parts.slice(cgIndex + 2).join('/')
        }
      }

      // Remove any remaining CDN prefixes
      key = key.replace(/^cdn\.(lokboxes|flippop)\.(ai|fun)\//, '')

      if (!key.startsWith('flippop/image/')) {
        throw new Error('无效的图像 URL 格式')
      }

      setKeyOutput(key)
      addToHistory('url_to_key', url, key)
      alert('提取成功')
    } catch (error) {
      alert('提取失败: ' + (error as Error).message)
    }
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    alert(success ? '已复制到剪贴板' : '复制失败')
  }

  const copyAllUrls = async () => {
    if (urlOutput.length === 0) {
      alert('没有可复制的内容')
      return
    }

    const success = await copyToClipboard(urlOutput.map(u => u.url).join('\n'))
    alert(success ? '已复制所有 URLs' : '复制失败')
  }

  const handlePaste = async (type: 'key' | 'url') => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      if (type === 'key') {
        setKeyInput(text)
      } else {
        setUrlInput(text)
      }
      alert('已粘贴')
    } else {
      alert('无法读取剪贴板')
    }
  }

  const loadExample = (type: 'key' | 'url') => {
    if (type === 'key') {
      const exampleKey = 'flippop/image/item/story/1996218524934668288/202512040537/6b3b2b76167b42c6a7ecfbb480e78219.jpeg'
      setKeyInput(exampleKey)
      setTimeout(() => convertKeyToUrls(), 100)
    } else {
      const exampleUrl = 'https://cdn.lokboxes.ai/cdn-cgi/image/quality=75,format=webp/flippop/image/item/story/1996218524934668288/202512040537/6b3b2b76167b42c6a7ecfbb480e78219.jpeg'
      setUrlInput(exampleUrl)
      setTimeout(() => extractKeyFromUrl(), 100)
    }
  }

  const loadFromHistory = (item: ImageHistoryItem) => {
    if (item.type === 'key_to_url') {
      setKeyInput(item.input)
      setActiveTab('key-to-url')
    } else {
      setUrlInput(item.input)
      setActiveTab('url-to-key')
    }
    hideHistory()
  }

  const handleUrlClick = (url: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      handleCopy(url)
    }
  }

  return (
    <Layout>
      <div className="image-converter">
        <div className="tab-container">
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'key-to-url' ? 'active' : ''}`}
              onClick={() => setActiveTab('key-to-url')}
            >
              <FontAwesomeIcon icon={faKey} /> KEY → URLS
            </button>
            <button
              className={`tab-btn ${activeTab === 'url-to-key' ? 'active' : ''}`}
              onClick={() => setActiveTab('url-to-key')}
            >
              <FontAwesomeIcon icon={faLink} /> URL → KEY
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'key-to-url' && (
              <div className="tab-pane active">
                <div className="panels">
                  {/* Input Panel */}
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title input">
                        <FontAwesomeIcon icon={faKey} /> INPUT KEY
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={() => handlePaste('key')}>
                          <FontAwesomeIcon icon={faPaste} /> PASTE
                        </button>
                        <button className="panel-btn" onClick={() => loadExample('key')}>
                          <FontAwesomeIcon icon={faCode} /> DEMO
                        </button>
                      </div>
                    </div>
                    <div className="panel-content">
                      <textarea
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        className="code-textarea"
                        placeholder="flippop/image/item/story/1996218524934668288/202512040537/6b3b2b76167b42c6a7ecfbb480e78219.jpeg"
                      />
                    </div>
                    <div className="panel-footer">
                      <div>
                        <span>{formatBytes(keyInput.length)} bytes</span>
                        <button
                          className="panel-btn"
                          onClick={showHistory}
                          style={{ marginLeft: '10px' }}
                        >
                          <FontAwesomeIcon icon={faHistory} /> 历史记录
                        </button>
                      </div>
                      <button className="cyber-btn-small" onClick={convertKeyToUrls}>
                        <FontAwesomeIcon icon={faSync} /> CONVERT
                      </button>
                    </div>
                  </div>

                  {/* Output Panel */}
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title output">
                        <FontAwesomeIcon icon={faCheck} /> OUTPUT URLS
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={copyAllUrls}>
                          <FontAwesomeIcon icon={faCopy} /> COPY ALL
                        </button>
                      </div>
                    </div>
                    <div className="panel-content">
                      {urlOutput.length > 0 ? (
                        <div className="url-list">
                          {urlOutput.map((item, index) => (
                            <div key={index} className="url-item">
                              <div className="url-item-header">
                                <FontAwesomeIcon icon={item.icon as any} />
                                {item.label}
                              </div>
                              <div
                                className="url-item-content"
                                onClick={(e) => handleUrlClick(item.url, e)}
                                title="点击复制，Ctrl+点击打开链接"
                              >
                                {item.url}
                              </div>
                              <div className="url-item-actions">
                                <button
                                  className="cyber-btn-small"
                                  onClick={() => handleCopy(item.url)}
                                >
                                  <FontAwesomeIcon icon={faCopy} /> 复制
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <FontAwesomeIcon icon={faArrowUp} />
                          <p>Enter Image Key to generate URLs</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'url-to-key' && (
              <div className="tab-pane active">
                <div className="panels">
                  {/* Input Panel */}
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title input">
                        <FontAwesomeIcon icon={faLink} /> INPUT URL
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={() => handlePaste('url')}>
                          <FontAwesomeIcon icon={faPaste} /> PASTE
                        </button>
                        <button className="panel-btn" onClick={() => loadExample('url')}>
                          <FontAwesomeIcon icon={faCode} /> DEMO
                        </button>
                      </div>
                    </div>
                    <div className="panel-content">
                      <textarea
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="code-textarea"
                        placeholder="https://cdn.lokboxes.ai/cdn-cgi/image/quality=75,format=webp/flippop/image/item/story/1996218524934668288/202512040537/6b3b2b76167b42c6a7ecfbb480e78219.jpeg"
                      />
                    </div>
                    <div className="panel-footer">
                      <div>
                        <span>{formatBytes(urlInput.length)} bytes</span>
                        <button
                          className="panel-btn"
                          onClick={showHistory}
                          style={{ marginLeft: '10px' }}
                        >
                          <FontAwesomeIcon icon={faHistory} /> 历史记录
                        </button>
                      </div>
                      <button className="cyber-btn-small" onClick={extractKeyFromUrl}>
                        <FontAwesomeIcon icon={faSearch} /> EXTRACT
                      </button>
                    </div>
                  </div>

                  {/* Output Panel */}
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title output">
                        <FontAwesomeIcon icon={faKey} /> OUTPUT KEY
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={() => keyOutput && handleCopy(keyOutput)}>
                          <FontAwesomeIcon icon={faCopy} /> COPY
                        </button>
                      </div>
                    </div>
                    <div className="panel-content">
                      {keyOutput ? (
                        <div className="key-output">
                          <div className="key-output-header">
                            <FontAwesomeIcon icon={faKey} />
                            提取的 Image Key
                          </div>
                          <div className="key-output-content">
                            {keyOutput}
                          </div>
                          <div className="url-item-actions">
                            <button
                              className="cyber-btn-small"
                              onClick={() => handleCopy(keyOutput)}
                            >
                              <FontAwesomeIcon icon={faCopy} /> 复制
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <FontAwesomeIcon icon={faArrowUp} />
                          <p>Enter URL to extract Image Key</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title="CONVERSION HISTORY"
          history={history}
          onClose={hideHistory}
          onClearAll={clearAllHistory}
          onDelete={deleteHistoryItem}
          onLoad={loadFromHistory}
          renderItemLabel={(item) => item.type === 'key_to_url' ? 'Key → URLs' : 'URL → Key'}
          renderItemPreview={(item) => item.input.length > 200 ? item.input.substring(0, 200) + '...' : item.input}
        />
      </div>
    </Layout>
  )
}