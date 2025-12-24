import Layout from './components/Layout'
import Link from 'next/link'
import {
  Code,
  Image,
  GitCompare,
  Clock,
  Key,
  Database
} from 'lucide-react'

const tools = [
  {
    href: '/json',
    title: 'JSON Tool',
    description: 'Format, validate, minify, and analyze JSON data',
    icon: Code
  },
  {
    href: '/image',
    title: 'Image Converter',
    description: 'Convert image keys/URLs and vice versa',
    icon: Image
  },
  {
    href: '/diff',
    title: 'JSON Diff',
    description: 'Compare two JSON objects and find differences',
    icon: GitCompare
  },
  {
    href: '/timestamp',
    title: 'Timestamp Converter',
    description: 'Convert between timestamps and human-readable dates',
    icon: Clock
  },
  {
    href: '/jwt',
    title: 'JWT Tool',
    description: 'Encode and decode JWT tokens',
    icon: Key
  }
]

export default function Home() {
  return (
    <Layout>
      <div className="container">
        <div className="hero">
          <h1>Welcome to Web Tools</h1>
          <p>A comprehensive suite of developer tools to make your life easier</p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <div className="tool-icon">
                <tool.icon size={24} />
              </div>
              <h3>{tool.title}</h3>
              <p>{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
