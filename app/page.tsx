import Layout from './components/Layout'
import Link from 'next/link'
import {
  Code,
  Image,
  GitCompare,
  Clock,
  Key,
  Cloud
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
  },
  {
    href: '/wordcloud',
    title: 'Word Cloud',
    description: 'Generate beautiful word cloud visualizations from text',
    icon: Cloud
  }
]

export default function Home() {
  return (
    <Layout>
      <div className="container">
        <div className="hero">
          <h1>Your everyday developer toolbox</h1>
          <p>Simple, fast, privacy-first tools that run entirely in your browser. No data leaves your device.</p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card">
              <div className="tool-icon">
                <tool.icon size={20} />
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
