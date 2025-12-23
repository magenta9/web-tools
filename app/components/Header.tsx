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
  { href: '/image', label: 'Image', icon: faImage },
  { href: '/diff', label: 'Diff', icon: faCodeCompare },
  { href: '/timestamp', label: 'Timestamp', icon: faClock },
  { href: '/jwt', label: 'JWT', icon: faKey },
]

export default function Header() {
  const pathname = usePathname()
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <FontAwesomeIcon icon={faCode} />
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
                <FontAwesomeIcon icon={item.icon} />
                {item.label}
              </Link>
            ))}
            <button
              className="nav-link theme-toggle"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
