'use client'

import Header from './Header'
import { memo } from 'react'

const Layout = memo(function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
})

export default Layout
