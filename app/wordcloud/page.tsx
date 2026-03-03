'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  Cloud,
  RefreshCw,
  Download,
  Trash2,
  Clipboard,
  Code,
  History
} from 'lucide-react'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard } from '../utils'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { STORAGE_KEYS } from '@/constants'
import '../tools.css'

interface WordCloudHistoryItem {
  type: 'generate'
  input: string
  output: string
  timestamp: number
}

interface WordEntry {
  text: string
  count: number
  fontSize: number
  color: string
  x: number
  y: number
  width: number
  height: number
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  // English
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'mine',
  'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his',
  'she', 'her', 'hers', 'they', 'them', 'their', 'theirs', 'what', 'which',
  'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'about',
  'above', 'after', 'again', 'also', 'am', 'any', 'because', 'before',
  'between', 'during', 'if', 'into', 'out', 'over', 'then', 'there',
  'through', 'under', 'until', 'up', 'while',
  // Chinese common particles
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '他', '她', '它', '们', '那', '些',
  '什么', '吗', '吧', '啊', '呢', '把', '被', '让', '给', '对', '得',
  '而', '但', '与', '或', '如', '从', '以', '及', '等', '过',
])

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#6366F1', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  '#EF4444', '#A855F7', '#0EA5E9', '#22C55E', '#E11D48',
]

function tokenize(text: string): string[] {
  // Handle mixed Chinese and English text
  const tokens: string[] = []

  // Split into segments by whitespace and punctuation, keeping Chinese characters together
  const segments = text.toLowerCase().split(/[\s\n\r\t,.:;!?'"()\[\]{}<>\/\\|@#$%^&*+=~`，。！？、；：""''（）【】《》\-—]+/)

  for (const segment of segments) {
    if (!segment) continue

    // Check if it contains Chinese characters
    if (/[\u4e00-\u9fff]/.test(segment)) {
      // For Chinese, split into individual characters or 2-char combinations
      const chars = segment.match(/[\u4e00-\u9fff]{2,3}|[\u4e00-\u9fff]|[a-z0-9]+/gi) || []
      tokens.push(...chars)
    } else {
      // For non-Chinese, use the whole word
      if (segment.length > 1) {
        tokens.push(segment)
      }
    }
  }

  return tokens
}

function countWords(text: string): Map<string, number> {
  const words = tokenize(text)
  const counts = new Map<string, number>()

  for (const word of words) {
    if (STOP_WORDS.has(word) || word.length < 2) continue
    counts.set(word, (counts.get(word) || 0) + 1)
  }

  return counts
}

function generateWordCloud(
  canvas: HTMLCanvasElement,
  text: string,
  isDarkMode: boolean
): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const wordCounts = countWords(text)
  if (wordCounts.size < 3) return false

  // Sort words by frequency, take top 80
  const sorted = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80)

  const maxCount = sorted[0][1]
  const minCount = sorted[sorted.length - 1][1]

  const width = canvas.width
  const height = canvas.height

  // Clear canvas
  ctx.fillStyle = isDarkMode ? '#0d0d0d' : '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Calculate font sizes
  const maxFontSize = 64
  const minFontSize = 14
  const entries: WordEntry[] = sorted.map(([word, count], index) => {
    const ratio = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount)
    const fontSize = Math.round(minFontSize + ratio * (maxFontSize - minFontSize))
    const color = COLORS[index % COLORS.length]

    ctx.font = `600 ${fontSize}px Inter, sans-serif`
    const metrics = ctx.measureText(word)
    const textWidth = metrics.width + 8
    const textHeight = fontSize * 1.2

    return {
      text: word,
      count,
      fontSize,
      color,
      x: 0,
      y: 0,
      width: textWidth,
      height: textHeight,
    }
  })

  // Place words using spiral algorithm
  const placed: WordEntry[] = []
  const centerX = width / 2
  const centerY = height / 2

  for (const entry of entries) {
    let angle = 0
    let radius = 0
    let found = false
    const step = 0.5
    const radiusStep = 2

    while (radius < Math.max(width, height) / 2) {
      const x = centerX + radius * Math.cos(angle) - entry.width / 2
      const y = centerY + radius * Math.sin(angle) - entry.height / 2

      // Check bounds
      if (x >= 4 && y >= 4 && x + entry.width <= width - 4 && y + entry.height <= height - 4) {
        // Check overlap with placed words
        let overlapping = false
        for (const p of placed) {
          if (
            x < p.x + p.width + 4 &&
            x + entry.width + 4 > p.x &&
            y < p.y + p.height + 2 &&
            y + entry.height + 2 > p.y
          ) {
            overlapping = true
            break
          }
        }

        if (!overlapping) {
          entry.x = x
          entry.y = y
          placed.push(entry)
          found = true
          break
        }
      }

      angle += step
      radius += radiusStep / (2 * Math.PI)
    }

    if (!found) {
      // Skip word if no place found
      continue
    }
  }

  // Draw words
  for (const entry of placed) {
    ctx.font = `600 ${entry.fontSize}px Inter, sans-serif`
    ctx.fillStyle = entry.color
    ctx.textBaseline = 'top'
    ctx.fillText(entry.text, entry.x + 4, entry.y + 2)
  }

  return true
}

const DEMO_TEXT = `Technology innovation artificial intelligence machine learning deep learning neural network
data science cloud computing software engineering web development frontend backend
API microservices DevOps container Docker Kubernetes serverless edge computing
blockchain cryptocurrency decentralized Web3 metaverse virtual reality augmented reality
cybersecurity encryption privacy data protection quantum computing
startup venture capital ecosystem Silicon Valley entrepreneur disruption
product design user experience interface accessibility responsive mobile
agile scrum sprint retrospective continuous integration deployment
open source community collaboration code review pull request
database SQL NoSQL Redis MongoDB PostgreSQL scalability performance
React TypeScript JavaScript Python Rust Go programming developer engineer
technology innovation artificial intelligence machine learning data science
cloud computing software development startup venture capital ecosystem`

export default function WordCloudPage() {
  const [textInput, setTextInput] = useState('')
  const [generated, setGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
  } = useHistory<WordCloudHistoryItem>({ storageKey: STORAGE_KEYS.WORDCLOUD_HISTORY })

  const handleGenerate = useCallback(() => {
    const text = textInput.trim()
    if (!text) {
      toast.warning(t.wordcloud.noText)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size for high quality
    canvas.width = 800
    canvas.height = 500

    const isDarkMode = document.documentElement.classList.contains('dark')
    const success = generateWordCloud(canvas, text, isDarkMode)

    if (success) {
      setGenerated(true)
      saveToHistory({ type: 'generate', input: text, output: '' })
      toast.success(t.wordcloud.generateSuccess)
    } else {
      toast.warning(t.wordcloud.minWords)
    }
  }, [textInput, toast, t, saveToHistory])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !generated) return

    const link = document.createElement('a')
    link.download = `wordcloud-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [generated])

  const handleClear = useCallback(() => {
    setTextInput('')
    setGenerated(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  const handlePaste = async () => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      setTextInput(text)
      toast.success(t.toast.pasteSuccess)
    } else {
      toast.error(t.toast.pasteFailed)
    }
  }

  const loadDemo = () => {
    setTextInput(DEMO_TEXT)
  }

  const loadFromHistory = (item: WordCloudHistoryItem) => {
    setTextInput(item.input)
    hideHistory()
  }

  return (
    <Layout>
      <div className="wordcloud-tool">
        <div className="tab-container">
          <div className="tab-buttons">
            <button className="tab-btn active">
              <Cloud size={14} /> {t.wordcloud.title}
            </button>
          </div>

          <div className="tab-content">
            <div className="tab-pane active">
              <div className="wordcloud-layout">
                {/* Input Panel */}
                <div className="panel wordcloud-input-panel">
                  <div className="panel-header">
                    <div className="panel-title input">
                      <Cloud size={14} /> {t.wordcloud.inputText}
                    </div>
                    <div className="panel-actions">
                      <button className="panel-btn" onClick={handlePaste}>
                        <Clipboard size={14} /> PASTE
                      </button>
                      <button className="panel-btn" onClick={loadDemo}>
                        <Code size={14} /> DEMO
                      </button>
                    </div>
                  </div>
                  <div className="panel-content">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="code-textarea"
                      placeholder={t.wordcloud.placeholder}
                    />
                  </div>
                  <div className="panel-footer">
                    <div>
                      <span>{textInput.length} chars</span>
                      <button
                        className="panel-btn"
                        onClick={showHistory}
                        style={{ marginLeft: '10px' }}
                      >
                        <History size={14} /> {t.common.history}
                      </button>
                    </div>
                    <div className="action-buttons">
                      <button className="cyber-btn-small" onClick={handleClear}>
                        <Trash2 size={14} /> {t.wordcloud.clear}
                      </button>
                      <button className="cyber-btn-small" onClick={handleGenerate}>
                        <RefreshCw size={14} /> {t.wordcloud.generate}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Output Panel */}
                <div className="panel wordcloud-output-panel">
                  <div className="panel-header">
                    <div className="panel-title output">
                      <Cloud size={14} /> {t.wordcloud.title}
                    </div>
                    <div className="panel-actions">
                      {generated && (
                        <button className="panel-btn" onClick={handleDownload}>
                          <Download size={14} /> {t.wordcloud.download}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="panel-content wordcloud-canvas-container">
                    <canvas
                      ref={canvasRef}
                      className="wordcloud-canvas"
                      width={800}
                      height={500}
                    />
                    {!generated && (
                      <div className="empty-state wordcloud-empty">
                        <Cloud size={48} />
                        <p>{t.wordcloud.placeholder}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title={t.common.history}
          history={history}
          onClose={hideHistory}
          onClearAll={clearAllHistory}
          onDelete={deleteHistoryItem}
          onLoad={loadFromHistory}
          renderItemLabel={() => t.wordcloud.title}
          renderItemPreview={(item) =>
            item.input.length > 200
              ? item.input.substring(0, 200) + '...'
              : item.input
          }
        />
      </div>
    </Layout>
  )
}
