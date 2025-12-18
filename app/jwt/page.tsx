'use client'

import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faKey,
  faLock,
  faUnlock,
  faCopy,
  faPaste,
  faHistory,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons'
import { SignJWT } from 'jose'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard, pasteFromClipboard } from '../utils'
import '../tools.css'

interface JwtHistoryItem {
  type: 'encode' | 'decode'
  input: string
  output: string
  timestamp: number
}

export default function JwtTool() {
  const [jwtInput, setJwtInput] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')
  const [secret, setSecret] = useState('your-secret-key')
  const [encodedJwt, setEncodedJwt] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const {
    history,
    historyVisible,
    saveToHistory,
    deleteHistoryItem,
    clearAllHistory,
    showHistory,
    hideHistory
  } = useHistory<JwtHistoryItem>({ storageKey: 'jwt_history' })

  const addToHistory = (type: JwtHistoryItem['type'], input: string, output: string) => {
    saveToHistory({ type, input, output })
  }

  const decodeJWT = () => {
    const jwt = jwtInput.trim()
    if (!jwt) {
      alert('请输入 JWT Token')
      return
    }

    try {
      const parts = jwt.split('.')
      if (parts.length !== 3) {
        throw new Error('无效的 JWT 格式')
      }

      const decodedHeader = JSON.parse(atob(parts[0]))
      const decodedPayload = JSON.parse(atob(parts[1]))

      setHeader(JSON.stringify(decodedHeader, null, 2))
      setPayload(JSON.stringify(decodedPayload, null, 2))
      setSignature(parts[2])

      addToHistory('decode', jwt, JSON.stringify({ header: decodedHeader, payload: decodedPayload }, null, 2))
      alert('JWT 解码成功')
    } catch (err) {
      alert('JWT 解码失败: ' + (err as Error).message)
    }
  }

  const encodeJWT = async () => {
    if (!header || !payload) {
      alert('请输入 Header 和 Payload')
      return
    }

    if (!secret) {
      alert('请输入密钥')
      return
    }

    try {
      const parsedHeader = JSON.parse(header)
      const parsedPayload = JSON.parse(payload)

      const secretKey = new TextEncoder().encode(secret)

      const jwt = await new SignJWT(parsedPayload)
        .setProtectedHeader(parsedHeader)
        .sign(secretKey)

      setEncodedJwt(jwt)
      addToHistory('encode', JSON.stringify({ header: parsedHeader, payload: parsedPayload }), jwt)
      alert('JWT 编码成功')
    } catch (err) {
      alert('JWT 编码失败: ' + (err as Error).message)
    }
  }

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text)
    alert(success ? '已复制到剪贴板' : '复制失败')
  }

  const handlePaste = async (type: 'jwt' | 'header' | 'payload') => {
    const text = await pasteFromClipboard()
    if (text !== null) {
      if (type === 'jwt') {
        setJwtInput(text)
      } else if (type === 'header') {
        setHeader(text)
      } else {
        setPayload(text)
      }
      alert('已粘贴')
    } else {
      alert('无法读取剪贴板')
    }
  }

  const clearAll = () => {
    setJwtInput('')
    setHeader('')
    setPayload('')
    setSignature('')
    setEncodedJwt('')
  }

  const loadExample = () => {
    setHeader(JSON.stringify({
      alg: 'HS256',
      typ: 'JWT'
    }, null, 2))

    setPayload(JSON.stringify({
      sub: '1234567890',
      name: 'John Doe',
      iat: 1516239022,
      exp: 1516242622
    }, null, 2))
  }

  const loadFromHistory = (item: JwtHistoryItem) => {
    if (item.type === 'decode') {
      setJwtInput(item.input)
    } else {
      try {
        const data = JSON.parse(item.input)
        setHeader(JSON.stringify(data.header, null, 2))
        setPayload(JSON.stringify(data.payload, null, 2))
      } catch (e) {
        setJwtInput(item.input)
      }
    }
    hideHistory()
  }

  return (
    <Layout>
      <div className="jwt-tool">
        <div className="jwt-container">
          <div className="tab-container">
            <div className="tab-buttons">
              <button
                className={`tab-btn active`}
              >
                <FontAwesomeIcon icon={faUnlock} /> JWT DECODER
              </button>
              <button
                className={`tab-btn`}
              >
                <FontAwesomeIcon icon={faLock} /> JWT ENCODER
              </button>
            </div>

            <div className="tab-content">
              <div className="tab-pane active">
                <div className="jwt-sections">
                  {/* JWT Input */}
                  <div className="jwt-section">
                    <div className="jwt-section-header">
                      JWT Token
                    </div>
                    <div className="jwt-section-content">
                      <textarea
                        value={jwtInput}
                        onChange={(e) => setJwtInput(e.target.value)}
                        className="code-textarea"
                        rows={4}
                        placeholder="粘贴 JWT Token 在这里..."
                      />
                      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button className="panel-btn" onClick={() => handlePaste('jwt')}>
                          <FontAwesomeIcon icon={faPaste} /> 粘贴
                        </button>
                        <button className="cyber-btn-small" onClick={decodeJWT}>
                          <FontAwesomeIcon icon={faUnlock} /> 解码
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Decoded Parts */}
                  {header && (
                    <>
                      <div className="jwt-section">
                        <div className="jwt-section-header">
                          Header
                          <button
                            className="panel-btn"
                            onClick={() => handleCopy(header)}
                            style={{ float: 'right' }}
                          >
                            <FontAwesomeIcon icon={faCopy} /> 复制
                          </button>
                        </div>
                        <div className="jwt-section-content">
                          <pre className="json-tree">{header}</pre>
                        </div>
                      </div>

                      <div className="jwt-section">
                        <div className="jwt-section-header">
                          Payload
                          <button
                            className="panel-btn"
                            onClick={() => handleCopy(payload)}
                            style={{ float: 'right' }}
                          >
                            <FontAwesomeIcon icon={faCopy} /> 复制
                          </button>
                        </div>
                        <div className="jwt-section-content">
                          <pre className="json-tree">{payload}</pre>
                        </div>
                      </div>

                      {signature && (
                        <div className="jwt-section">
                          <div className="jwt-section-header">
                            Signature
                          </div>
                          <div className="jwt-section-content">
                            <code style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                              {signature}
                            </code>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Encode Section */}
                <div className="jwt-sections" style={{ marginTop: '30px' }}>
                  <h3 style={{ marginBottom: '20px' }}>
                    <FontAwesomeIcon icon={faLock} /> JWT ENCODER
                  </h3>

                  {/* Secret Key */}
                  <div className="jwt-section">
                    <div className="jwt-section-header">
                      Secret Key
                      <button
                        className="panel-btn"
                        onClick={() => setShowSecret(!showSecret)}
                        style={{ float: 'right' }}
                      >
                        <FontAwesomeIcon icon={showSecret ? faEyeSlash : faEye} />
                        {showSecret ? '隐藏' : '显示'}
                      </button>
                    </div>
                    <div className="jwt-section-content">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="输入密钥"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Header */}
                    <div className="jwt-section">
                      <div className="jwt-section-header">
                        Header
                        <div style={{ float: 'right', display: 'flex', gap: '8px' }}>
                          <button
                            className="panel-btn"
                            onClick={() => handlePaste('header')}
                          >
                            <FontAwesomeIcon icon={faPaste} />
                          </button>
                          <button
                            className="panel-btn"
                            onClick={loadExample}
                          >
                            示例
                          </button>
                        </div>
                      </div>
                      <div className="jwt-section-content">
                        <textarea
                          value={header}
                          onChange={(e) => setHeader(e.target.value)}
                          className="code-textarea"
                          rows={6}
                          placeholder='{"alg": "HS256", "typ": "JWT"}'
                        />
                      </div>
                    </div>

                    {/* Payload */}
                    <div className="jwt-section">
                      <div className="jwt-section-header">
                        Payload
                        <button
                          className="panel-btn"
                          onClick={() => handlePaste('payload')}
                          style={{ float: 'right' }}
                        >
                          <FontAwesomeIcon icon={faPaste} />
                        </button>
                      </div>
                      <div className="jwt-section-content">
                        <textarea
                          value={payload}
                          onChange={(e) => setPayload(e.target.value)}
                          className="code-textarea"
                          rows={6}
                          placeholder='{"sub": "1234567890", "name": "John Doe"}'
                        />
                      </div>
                    </div>
                  </div>

                  <button className="cyber-btn-small" onClick={encodeJWT} style={{ marginTop: '20px' }}>
                    <FontAwesomeIcon icon={faLock} /> 生成 JWT
                  </button>

                  {encodedJwt && (
                    <div className="jwt-section" style={{ marginTop: '20px' }}>
                      <div className="jwt-section-header">
                        Generated JWT
                        <button
                          className="panel-btn"
                          onClick={() => handleCopy(encodedJwt)}
                          style={{ float: 'right' }}
                        >
                          <FontAwesomeIcon icon={faCopy} /> 复制
                        </button>
                      </div>
                      <div className="jwt-section-content">
                        <code style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                          {encodedJwt}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* History Button */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              className="panel-btn"
              onClick={showHistory}
            >
              <FontAwesomeIcon icon={faHistory} /> 历史记录
            </button>
          </div>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title="JWT 处理历史"
          history={history}
          onClose={hideHistory}
          onClearAll={clearAllHistory}
          onDelete={deleteHistoryItem}
          onLoad={loadFromHistory}
          renderItemLabel={(item) => item.type === 'encode' ? '编码' : '解码'}
          renderItemPreview={(item) => item.input.length > 100 ? item.input.substring(0, 100) + '...' : item.input}
        />
      </div>
    </Layout>
  )
}