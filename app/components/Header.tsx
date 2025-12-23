'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCode,
  faImage,
  faCodeCompare,
  faClock,
  faKey,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '../providers/ThemeProvider'

const navItems = [
  { href: '/json', label: 'JSON', icon: faCode },
  { href: '/image', label: 'IMAGE', icon: faImage },
  { href: '/diff', label: 'DIFF', icon: faCodeCompare },
  { href: '/timestamp', label: 'TIMESTAMP', icon: faClock },
  { href: '/jwt', label: 'JWT', icon: faKey },
]

export default function Header() {
  const pathname = usePathname()
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">
            <FontAwesomeIcon icon={faImage} />
          </div>
          <div className="logo-text">
            <h1 className="logo-title">Web Tools</h1>
            <p className="logo-subtitle">~ your handy developer toolkit ~</p>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={item.icon} /> {item.label}
            </Link>
          ))}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
          </button>
        </nav>
      </div>
    </header>
  )
}
