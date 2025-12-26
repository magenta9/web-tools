'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Code,
  Image,
  GitCompare,
  Clock,
  Key,
  Sun,
  Moon,
  Database,
  FileJson,
  ChevronDown,
  Sparkles,
  Wrench,
  Languages,
  BookText,
  MessageSquare
} from 'lucide-react'
import { useTheme } from '../providers/ThemeProvider'
import { memo, useState, useRef } from 'react'

const regularTools = [
  { href: '/json', label: 'JSON Tool', Icon: Code },
  { href: '/image', label: 'Image Converter', Icon: Image },
  { href: '/diff', label: 'JSON Diff', Icon: GitCompare },
  { href: '/timestamp', label: 'Timestamp Converter', Icon: Clock },
  { href: '/jwt', label: 'JWT Tool', Icon: Key },
]

const aiTools = [
  { href: '/jsonfix', label: 'AI JSON Fix', Icon: FileJson },
  { href: '/aisql', label: 'AI SQL', Icon: Database },
  { href: '/translate', label: 'AI翻译', Icon: Languages },
  { href: '/prompt', label: 'Prompt管理', Icon: BookText },
  { href: '/chat', label: 'AI Chat', Icon: MessageSquare },
]

const Header = memo(function Header() {
  const pathname = usePathname()
  const { isDarkMode, toggleTheme } = useTheme()
  const [regularDropdownOpen, setRegularDropdownOpen] = useState(false)
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false)
  const closeTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const clearCloseTimer = (key: string) => {
    const timer = closeTimerRef.current.get(key)
    if (timer) {
      clearTimeout(timer)
      closeTimerRef.current.delete(key)
    }
  }

  const handleDropdownLeave = (key: string, setter: (val: boolean) => void) => {
    const timer = setTimeout(() => {
      setter(false)
    }, 300)
    closeTimerRef.current.set(key, timer)
  }

  const handleDropdownEnter = (key: string) => {
    clearCloseTimer(key)
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <Code size={20} />
            </div>
            <div className="logo-text">
              <h1 className="logo-title">Web Tools</h1>
              <p className="logo-subtitle">Developer Utilities</p>
            </div>
          </Link>

          <nav className="nav">
            {/* Regular Tools Dropdown */}
            <div
              className="dropdown"
              onMouseLeave={() => handleDropdownLeave('regular', setRegularDropdownOpen)}
            >
              <button
                className="nav-link dropdown-toggle"
                onMouseEnter={() => {
                  handleDropdownEnter('regular')
                  setRegularDropdownOpen(true)
                }}
                onClick={(e) => {
                  e.preventDefault()
                  setRegularDropdownOpen(!regularDropdownOpen)
                }}
              >
                <Wrench size={16} />
                普通工具
                <ChevronDown size={14} className={`chevron ${regularDropdownOpen ? 'open' : ''}`} />
              </button>
              {regularDropdownOpen && (
                <div
                  className="dropdown-menu"
                  onMouseEnter={() => handleDropdownEnter('regular')}
                >
                  {regularTools.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`dropdown-item ${pathname === item.href ? 'active' : ''}`}
                      onClick={() => {
                        clearCloseTimer('regular')
                        setRegularDropdownOpen(false)
                      }}
                    >
                      <item.Icon size={16} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* AI Tools Dropdown */}
            <div
              className="dropdown"
              onMouseLeave={() => handleDropdownLeave('ai', setAiDropdownOpen)}
            >
              <button
                className="nav-link dropdown-toggle ai-dropdown"
                onMouseEnter={() => {
                  handleDropdownEnter('ai')
                  setAiDropdownOpen(true)
                }}
                onClick={(e) => {
                  e.preventDefault()
                  setAiDropdownOpen(!aiDropdownOpen)
                }}
              >
                <Sparkles size={16} />
                AI工具
                <ChevronDown size={14} className={`chevron ${aiDropdownOpen ? 'open' : ''}`} />
              </button>
              {aiDropdownOpen && (
                <div
                  className="dropdown-menu"
                  onMouseEnter={() => handleDropdownEnter('ai')}
                >
                  {aiTools.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`dropdown-item ${pathname === item.href ? 'active' : ''}`}
                      onClick={() => {
                        clearCloseTimer('ai')
                        setAiDropdownOpen(false)
                      }}
                    >
                      <item.Icon size={16} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              className="nav-link theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
})

export default Header
