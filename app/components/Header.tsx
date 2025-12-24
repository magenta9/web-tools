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
  Database
} from 'lucide-react'
import { useTheme } from '../providers/ThemeProvider'
import { memo } from 'react'

const navItems = [
  { href: '/json', label: 'JSON', Icon: Code },
  { href: '/image', label: 'Image', Icon: Image },
  { href: '/diff', label: 'Diff', Icon: GitCompare },
  { href: '/timestamp', label: 'Timestamp', Icon: Clock },
  { href: '/jwt', label: 'JWT', Icon: Key },
]

const Header = memo(function Header() {
  const pathname = usePathname()
  const { isDarkMode, toggleTheme } = useTheme()

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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <item.Icon size={16} />
                {item.label}
              </Link>
            ))}
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
