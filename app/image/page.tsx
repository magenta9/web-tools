'use client'

import React, { useState } from 'react'
import {
  Key,
  Link,
  RefreshCw,
  Search,
  Copy,
  Clipboard,
  Code,
  Check,
  ArrowUp,
  History
} from 'lucide-react'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard, formatBytes } from '../utils'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { CDN_URLS, IMAGE_PRESETS, STORAGE_KEYS, EXAMPLES } from '@/constants'
import { getErrorMessage } from '@/types'
import type { UrlItem, ImageTab } from '@/types'
import '../tools.css'

interface ImageHistoryItem {
  type: 'key_to_url' | 'url_to_key'
  input: string
  output: string
  timestamp: number
}

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  globe: Globe,
  flag: Flag,
  compress: Package,
  'expand-arrows-alt': Expand,
  tv: Monitor
}

// Import additional icons
import { Globe, Flag, Package, Expand, Monitor } from 'lucide-react'

export default function ImageConverter() {
  const [activeTab, setActiveTab] = useState<ImageTab>('key-to-url')
  const [keyInput, setKeyInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlOutput, setUrlOutput] = useState<UrlItem[]>([])
  const [keyOutput, setKeyOutput] = useState('')
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
  } = useHistory<ImageHistoryItem>({ storageKey: STORAGE_KEYS.IMAGE_HISTORY })

  const addToHistory = (type: ImageHistoryItem['type'], input: string, output: string) => {
    saveToHistory({ type, input, output })
  }

  const convertKeyToUrls = () => {
    const key = keyInput.trim()
    if (!key) {
      toast.warning(t.validation.required)
      return
    }

    const urls: UrlItem[] = [
      { label: t.image.originalCdn, url: CDN_URLS.BASE + key, icon: 'globe' },
      { label: t.image.frenchCdn, url: CDN_URLS.FRENCH + key, icon: 'flag' },
      { label: t.image.optimizedWebp, url: CDN_URLS.BASE + IMAGE_PRESETS.WEBP_QUALITY_75 + key, icon: 'compress' },
      { label: t.image.optimizedWidth400, url: CDN_URLS.BASE + IMAGE_PRESETS.WIDTH_400_QUALITY_75 + key, icon: 'expand-arrows-alt' },
      { label: t.image.optimizedWidth800, url: CDN_URLS.BASE + IMAGE_PRESETS.WIDTH_800_QUALITY_85 + key, icon: 'tv' }
    ]

    setUrlOutput(urls)
    const outputText = urls.map(u => u.url).join('\n')
    addToHistory('key_to_url', key, outputText)
    toast.success(t.image.convertSuccess)
  }

  const extractKeyFromUrl = () => {
    const url = urlInput.trim()
    if (!url) {
      toast.warning(t.validation.required)
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
        throw new Error(t.validation.invalidUrl)
      }

      setKeyOutput(key)
      addToHistory('url_to_key', url, key)
      toast.success(t.image.extractSuccess)
    } catch (error) {
      toast.error(`${t.image.extractFailed}: ${getErrorMessage(error)}`)
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

  const copyAllUrls = async () => {
    if (urlOutput.length === 0) {
      toast.warning(t.validation.required)
      return
    }

    const success = await copyToClipboard(urlOutput.map(u => u.url).join('\n'))
    if (success) {
      toast.success(t.toast.copySuccess)
    } else {
      toast.error(t.toast.copyFailed)
    }
  }

  const handlePaste = async (type: 'key' | 'url') => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      if (type === 'key') {
        setKeyInput(text)
      } else {
        setUrlInput(text)
      }
      toast.success(t.toast.pasteSuccess)
    } else {
      toast.error(t.toast.pasteFailed)
    }
  }

  const loadExample = (type: 'key' | 'url') => {
    if (type === 'key') {
      setKeyInput(EXAMPLES.IMAGE_KEY)
    } else {
      setUrlInput(EXAMPLES.IMAGE_URL)
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

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Globe
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
              <Key size={14} /> KEY → URLS
            </button>
            <button
              className={`tab-btn ${activeTab === 'url-to-key' ? 'active' : ''}`}
              onClick={() => setActiveTab('url-to-key')}
            >
              <Link size={14} /> URL → KEY
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
                        <Key size={14} /> INPUT KEY
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={() => handlePaste('key')}>
                          <Clipboard size={14} /> PASTE
                        </button>
                        <button className="panel-btn" onClick={() => loadExample('key')}>
                          <Code size={14} /> DEMO
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
                          <History size={14} /> 历史记录
                        </button>
                      </div>
                      <button className="cyber-btn-small" onClick={convertKeyToUrls}>
                        <RefreshCw size={14} /> CONVERT
                      </button>
                    </div>
                  </div>

                  {/* Output Panel */}
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title output">
                        <Check size={14} /> OUTPUT URLS
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={copyAllUrls}>
                          <Copy size={14} /> COPY ALL
                        </button>
                      </div>
                    </div>
                    <div className="panel-content">
                      {urlOutput.length > 0 ? (
                        <div className="url-list">
                          {urlOutput.map((item, index) => {
                            const IconComponent = getIconComponent(item.icon)
                            return (
                              <div key={index} className="url-item">
                                <div className="url-item-header">
                                  <IconComponent size={14} />
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
                                    <Copy size={14} /> 复制
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="empty-state">
                          <ArrowUp size={32} />
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
                        <Link size={14} /> INPUT URL
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={() => handlePaste('url')}>
                          <Clipboard size={14} /> PASTE
                        </button>
                        <button className="panel-btn" onClick={() => loadExample('url')}>
                          <Code size={14} /> DEMO
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
                          <History size={14} /> 历史记录
                        </button>
                      </div>
                      <button className="cyber-btn-small" onClick={extractKeyFromUrl}>
                        <Search size={14} /> EXTRACT
                      </button>
                    </div>
                  </div>

                  {/* Output Panel */}
                  <div className="panel">
                    <div className="panel-header">
                      <div className="panel-title output">
                        <Key size={14} /> OUTPUT KEY
                      </div>
                      <div className="panel-actions">
                        <button className="panel-btn" onClick={() => keyOutput && handleCopy(keyOutput)}>
                          <Copy size={14} /> COPY
                        </button>
                      </div>
                    </div>
                    <div className="panel-content">
                      {keyOutput ? (
                        <div className="key-output">
                          <div className="key-output-header">
                            <Key size={14} />
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
                              <Copy size={14} /> 复制
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <ArrowUp size={32} />
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
