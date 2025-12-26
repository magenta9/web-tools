'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownMessageProps {
    content: string
    isDarkMode: boolean
}

export function MarkdownMessage({ content, isDarkMode }: MarkdownMessageProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(props: any) {
                    const { className, children, node, ...rest } = props
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''

                    // Check if it's a code block (not inline) by checking if it has a language
                    // Inline codes don't have language- prefix in className
                    const isInline = !className || !language

                    if (!isInline) {
                        return (
                            <SyntaxHighlighter
                                style={isDarkMode ? oneDark : oneLight}
                                language={language}
                                PreTag="div"
                                customStyle={{
                                    borderRadius: '6px',
                                    margin: '8px 0',
                                    fontSize: '13px'
                                }}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        )
                    }

                    return (
                        <code className="inline-code" {...rest}>
                            {children}
                        </code>
                    )
                },
                p({ children }) {
                    return <p className="markdown-paragraph">{children}</p>
                },
                a({ children, href }) {
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="markdown-link"
                        >
                            {children}
                        </a>
                    )
                }
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
