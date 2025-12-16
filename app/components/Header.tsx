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
      <div className="corner-decoration corner-tl"></div>
      <div className="corner-decoration corner-tr"></div>

      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">
            <FontAwesomeIcon icon={faImage} />
          </div>
          <div className="logo-text">
            <h1 className="logo-title glitch">WEB TOOLS</h1>
            <p className="logo-subtitle cyber-text">{'/* '} Developer Tools Suite v4.0 {' */'}</p>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <FontAwesomeIcon icon={item.icon} /> {item.label}
            </Link>
          ))}
          <button
            className="nav-link theme-toggle"
            onClick={toggleTheme}
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
            <span style={{ marginLeft: '5px' }}>
              {isDarkMode ? 'LIGHT' : 'DARK'}
            </span>
          </button>
        </nav>
      </div>

      <div className="loading-bar"></div>
    </header>
  )
}