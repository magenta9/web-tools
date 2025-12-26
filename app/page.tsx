import Layout from './components/Layout'
import Link from 'next/link'
import {
  Code,
  Image,
  GitCompare,
  Clock,
  Key,
  Database,
  FileJson,
  Sparkles,
  Languages,
  MessageSquare,
  BookText
} from 'lucide-react'

const regularTools = [
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

const aiTools = [
  {
    href: '/jsonfix',
    title: 'AI JSON Fix',
    description: 'Fix non-standard JSON data with AI',
    icon: FileJson
  },
  {
    href: '/aisql',
    title: 'AI SQL',
    description: 'Natural language to SQL with AI',
    icon: Database
  },
  {
    href: '/translate',
    title: 'AI翻译',
    description: 'AI-powered translation between Chinese, English, and Japanese',
    icon: Languages
  },
  {
    href: '/prompt',
    title: 'Prompt 管理',
    description: 'Manage and organize your AI prompt templates',
    icon: BookText
  },
  {
    href: '/chat',
    title: 'AI Chat',
    description: 'Chat with AI using your prompt templates',
    icon: MessageSquare
  }
]

export default function Home() {
  return (
    <Layout>
      <div className="home">
        <section className="hero">
          <div className="hero-content">
            <h1>Web Tools</h1>
            <p>A collection of developer utilities to boost your productivity</p>
          </div>
        </section>

        <section className="tools-section">
          <div className="section-header">
            <h2>Tools</h2>
          </div>
          <div className="tools-grid">
            {regularTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="tool-card">
                <div className="tool-icon">
                  <tool.icon size={24} />
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="tools-section ai-section">
          <div className="section-header ai-header">
            <Sparkles size={20} />
            <h2>AI Powered</h2>
          </div>
          <div className="tools-grid">
            {aiTools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="tool-card ai-card">
                <div className="tool-icon ai-icon">
                  <tool.icon size={24} />
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}
