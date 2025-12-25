'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Database,
  Zap,
  Play,
  History,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Table,
  Wand2,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Check
} from 'lucide-react'
import Layout from '../components/Layout'
import { HistoryPanel } from '../components/HistoryPanel'
import { useHistory } from '../hooks/useHistory'
import { copyToClipboard } from '../utils'
import { useToastContext } from '../providers/ToastProvider'
import { useI18n } from '../providers/I18nProvider'
import { STORAGE_KEYS } from '@/constants'
import './tools.css'

interface DbConfig {
  type: 'mysql' | 'postgres'
  host: string
  port: number
  user: string
  password: string
  database: string
  ssl: boolean
}

interface SchemaInfo {
  tables: Array<{
    name: string
    columns: Array<{
      name: string
      type: string
      nullable: boolean
      isPrimaryKey: boolean
    }>
    primaryKeys: string[]
  }>
  formatted: string
}

interface AiSqlHistoryItem {
  type: string
  input: string
  output: string
  timestamp: number
  mode: string
  dbConfig: DbConfig
}

interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

const DEFAULT_CONFIG: DbConfig = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: '',
  ssl: false
}

const API_BASE = 'http://localhost:3001/api'

export default function AiSqlTool() {
  const toast = useToastContext()
  const { t } = useI18n()

  // Database config state
  const [config, setConfig] = useState<DbConfig>({ ...DEFAULT_CONFIG })
  const [showPassword, setShowPassword] = useState(false)

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [databases, setDatabases] = useState<string[]>([])
  const [schema, setSchema] = useState<SchemaInfo | null>(null)
  const [schemaExpanded, setSchemaExpanded] = useState(false)
  const isLoadingSchemaRef = useRef(false)
  const lastLoadedDbRef = useRef<string | null>(null)

  // AI state
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('llama3.2')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Query state
  const [naturalInput, setNaturalInput] = useState('')
  const [generatedSql, setGeneratedSql] = useState('')
  const [queryResult, setQueryResult] = useState<string>('')
  const [queryError, setQueryError] = useState<string>('')
  const [queryExecuted, setQueryExecuted] = useState(false)
  const [queryHeaders, setQueryHeaders] = useState<string[]>([])
  const [queryRows, setQueryRows] = useState<string[][]>([])
  const [queryHasTabs, setQueryHasTabs] = useState(false)

  // Schema selected table
  const [selectedTable, setSelectedTable] = useState<string | null>(null)

  // History
  const {
    history,
    historyVisible,
    saveToHistory,
    deleteHistoryItem,
    clearAllHistory,
    showHistory,
    hideHistory
  } = useHistory<AiSqlHistoryItem>({ storageKey: STORAGE_KEYS.AISQL_HISTORY })

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem('aisql_db_config')
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch {
        // Use default
      }
    }
  }, [])

  // Load models from Ollama
  useEffect(() => {
    let mounted = true

    const loadModels = async () => {
      try {
        const res = await fetch(`${API_BASE}/ollama/models`)
        const data = await res.json()
        if (mounted && data.success && data.models) {
          setModels(data.models)
          if (data.models.length > 0) {
            // Check if current selected model is available
            const currentModelAvailable = data.models.some((m: OllamaModel) => m.name === selectedModel)
            if (!currentModelAvailable && data.models.length > 0) {
              setSelectedModel(data.models[0].name)
            }
          }
        }
      } catch {
        // Ollama might not be running
      }
    }

    loadModels()

    return () => {
      mounted = false
    }
  }, [])

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: DbConfig) => {
    localStorage.setItem('aisql_db_config', JSON.stringify(newConfig))
    // Clear schema cache if database changes
    if (newConfig.database !== config.database) {
      lastLoadedDbRef.current = null
      setSchema(null)
    }
    setConfig(newConfig)
  }, [config.database])

  // Test database connection
  const testConnection = async () => {
    if (!config.host || !config.user) {
      toast.error(t.validation.required)
      return
    }

    setIsConnecting(true)
    try {
      const res = await fetch(`${API_BASE}/db/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Connection successful')
        setIsConnected(true)
        // Clear schema cache on new connection
        lastLoadedDbRef.current = null
        setSchema(null)

        // Get databases
        const dbRes = await fetch(`${API_BASE}/db/databases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        })
        const dbData = await dbRes.json()
        if (dbData.success) {
          setDatabases(dbData.databases)
        }
      } else {
        toast.error(`Connection failed: ${data.error}`)
        setIsConnected(false)
      }
    } catch {
      toast.error('Failed to connect to API server')
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  // Fetch schema with caching
  const fetchSchema = useCallback(async () => {
    if (!config.database) {
      toast.warning('Please select a database')
      return
    }

    // Don't reload if already loading or schema for this database is already loaded
    if (isLoadingSchemaRef.current || lastLoadedDbRef.current === config.database) {
      return
    }

    try {
      isLoadingSchemaRef.current = true
      const res = await fetch(`${API_BASE}/db/schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      const data = await res.json()

      if (data.success) {
        setSchema(data.schema)
        lastLoadedDbRef.current = config.database
        toast.success('Schema loaded')
      } else {
        toast.error(`Failed to load schema: ${data.error}`)
      }
    } catch {
      toast.error('Failed to load schema')
    } finally {
      isLoadingSchemaRef.current = false
    }
  }, [config, toast])

  // Debounce ref for schema loading
  const schemaLoadTimeout = useRef<NodeJS.Timeout | null>(null)

  // Auto-fetch schema when connected and database selected (with debounce)
  useEffect(() => {
    if (isConnected && config.database) {
      // Clear any pending load
      if (schemaLoadTimeout.current) {
        clearTimeout(schemaLoadTimeout.current)
      }
      // Debounce schema loading
      schemaLoadTimeout.current = setTimeout(() => {
        fetchSchema()
      }, 500)
    }
    return () => {
      if (schemaLoadTimeout.current) {
        clearTimeout(schemaLoadTimeout.current)
      }
    }
  }, [isConnected, config.database, fetchSchema])

  // Generate SQL
  const generateSQL = async () => {
    if (!naturalInput.trim()) {
      toast.warning(t.validation.required)
      return
    }

    if (!schema) {
      toast.warning('Please connect to database and load schema first')
      return
    }

    setIsGenerating(true)
    setGeneratedSql('')
    setQueryResult('')
    setQueryError('')

    try {
      const res = await fetch(`${API_BASE}/ollama/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: naturalInput,
          schema: schema.formatted,
          model: selectedModel,
          dbType: config.type
        })
      })
      const data = await res.json()

      if (data.success) {
        setGeneratedSql(data.sql)
        toast.success('SQL generated')
      } else {
        toast.error(`Generation failed: ${data.error}`)
      }
    } catch {
      toast.error('Failed to generate SQL')
    } finally {
      setIsGenerating(false)
    }
  }

  // Execute SQL
  const executeSQL = async () => {
    if (!generatedSql.trim()) {
      toast.warning('No SQL to execute')
      return
    }

    setIsExecuting(true)
    setQueryResult('')
    setQueryError('')

    try {
      const res = await fetch(`${API_BASE}/db/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: generatedSql,
          ...config
        })
      })
      const data = await res.json()

      if (data.success) {
        // 解析查询结果为表格数据
        const output = data.output || 'Query executed successfully (no results)'
        setQueryResult(output)
        setQueryHasTabs(data.hasTabs || false)

        // 解析表头和数据行
        if (data.header && data.rows) {
          if (data.hasTabs) {
            // Tab-separated format (multiple columns)
            const headers = data.header.split('\t')
            const rows = data.rows.map(row => row.split('\t'))
            setQueryHeaders(headers)
            setQueryRows(rows)
          } else {
            // Single column format (like SHOW TABLES)
            setQueryHeaders([data.header])
            setQueryRows(data.rows.map(row => [row]))
          }
        } else {
          setQueryHeaders([])
          setQueryRows([])
        }

        setQueryExecuted(true)
        toast.success(`Query executed - ${data.rowCount || 0} rows returned`)

        // Save to history
        saveToHistory({
          type: 'aisql_query',
          input: naturalInput,
          output: generatedSql,
          mode: 'sql_generation',
          dbConfig: { ...config, password: '' } // Don't save password
        })
      } else {
        setQueryError(data.error || 'Query failed')
        toast.error(`Query failed: ${data.error}`)
      }
    } catch {
      toast.error('Failed to execute query')
    } finally {
      setIsExecuting(false)
    }
  }

  // Copy SQL
  const handleCopySQL = async () => {
    if (generatedSql) {
      const success = await copyToClipboard(generatedSql)
      if (success) {
        toast.success(t.toast.copySuccess)
      } else {
        toast.error(t.toast.copyFailed)
      }
    }
  }

  // Clear all
  const clearAll = () => {
    setNaturalInput('')
    setGeneratedSql('')
    setQueryResult('')
    setQueryError('')
    setQueryExecuted(false)
    setQueryHeaders([])
    setQueryRows([])
    setQueryHasTabs(false)
  }

  // Load from history
  const loadFromHistory = (item: AiSqlHistoryItem) => {
    setNaturalInput(item.input)
    setGeneratedSql(item.output)
    setQueryResult('')
    setQueryError('')
    setQueryExecuted(false)
    setQueryHeaders([])
    setQueryRows([])
    setQueryHasTabs(false)
    hideHistory()
    toast.success(t.toast.loadSuccess)
  }

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Layout>
      <div className="aisql-tool">
        {/* Header with connection status */}
        <div className="aisql-header">
          <div className="header-title">
            <div className="title-icon">
              <Database size={20} className="text-white" />
            </div>
            <h1>AI SQL Agent <span className="version-badge">v1.0</span></h1>
          </div>
          <div className="header-status">
            <span className={`connection-badge ${isConnected ? 'connected' : ''}`}>
              {isConnected ? t.aisql.connected : t.aisql.disconnected}
            </span>
            <button
              className="connect-btn"
              onClick={testConnection}
              disabled={isConnecting}
            >
              {isConnecting ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
              {isConnecting ? t.aisql.loading : t.aisql.connect}
            </button>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="config-card">
          <div className="config-header">
            <Database size={16} className="config-header-icon" />
            <span className="config-header-title">{t.aisql.databaseConfig}</span>
          </div>
          <div className="config-grid">
            <div className="config-field">
              <label>数据库类型</label>
              <select
                value={config.type}
                onChange={(e) => {
                  const newType = e.target.value as 'mysql' | 'postgres'
                  const newPort = newType === 'mysql' ? 3306 : 5432
                  saveConfig({ ...config, type: newType, port: newPort })
                }}
              >
                <option value="mysql">MySQL</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>
            <div className="config-field">
              <label>{t.aisql.host}</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => saveConfig({ ...config, host: e.target.value })}
                placeholder="localhost"
              />
            </div>
            <div className="config-field">
              <label>{t.aisql.port}</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => saveConfig({ ...config, port: parseInt(e.target.value) || 3306 })}
                placeholder="3306"
              />
            </div>
            <div className="config-field">
              <label>{t.aisql.user}</label>
              <input
                type="text"
                value={config.user}
                onChange={(e) => saveConfig({ ...config, user: e.target.value })}
                placeholder="root"
              />
            </div>
            <div className="config-field">
              <label>{t.aisql.password}</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => saveConfig({ ...config, password: e.target.value })}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="config-field col-span-4">
              <label>{t.aisql.database}</label>
              <select
                value={config.database}
                onChange={(e) => saveConfig({ ...config, database: e.target.value })}
              >
                <option value="">{t.aisql.selectDatabase}</option>
                {databases.map((db) => (
                  <option key={db} value={db}>{db}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schema Display */}
        {schema && (
          <div className={`schema-panel ${schemaExpanded ? 'expanded' : ''}`}>
            <div className="schema-header" onClick={() => setSchemaExpanded(!schemaExpanded)}>
              <div className="schema-title">
                <Table size={16} />
                <span>Database Schema ({schema.tables.length} {t.aisql.tables})</span>
              </div>
              <button className="panel-btn" onClick={(e) => e.stopPropagation()}>
                {schemaExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {schemaExpanded && (
              <div className="schema-content">
                {/* Left: Table List */}
                <div className="schema-table-list">
                  {schema.tables.map((table) => (
                    <div
                      key={table.name}
                      className={`schema-table-item ${selectedTable === table.name ? 'active' : ''}`}
                      onClick={() => setSelectedTable(table.name)}
                    >
                      <div className="schema-table-item-name">
                        <Table size={12} />
                        {table.name}
                      </div>
                      <span className="schema-table-item-count">{table.columns.length}</span>
                    </div>
                  ))}
                </div>

                {/* Right: Table Detail */}
                <div className="schema-table-detail">
                  {selectedTable ? (
                    <>
                      <div className="schema-detail-header">
                        <div className="schema-detail-title">
                          <Table size={14} />
                          {selectedTable}
                        </div>
                        <button className="schema-detail-close" onClick={() => setSelectedTable(null)}>
                          <X size={14} />
                        </button>
                      </div>
                      <div className="schema-detail-wrapper">
                        {(() => {
                          const table = schema.tables.find(t => t.name === selectedTable)
                          if (!table) return null
                          return (
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Column</th>
                                  <th>Type</th>
                                  <th>Nullable</th>
                                  <th>Key</th>
                                </tr>
                              </thead>
                              <tbody>
                                {table.columns.map((col) => (
                                  <tr key={col.name}>
                                    <td>
                                      <span style={{ color: col.isPrimaryKey ? '#3b82f6' : '#a1a1aa', fontWeight: col.isPrimaryKey ? 500 : 400 }}>
                                        {col.name}
                                      </span>
                                    </td>
                                    <td>{col.type}</td>
                                    <td>{col.nullable ? 'YES' : 'NO'}</td>
                                    <td>{col.isPrimaryKey ? 'PRI' : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="schema-detail-empty">
                      Select a table to view its structure
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Query Area */}
        <div className="query-area">
          {/* Natural Language Input Panel */}
          <div className="panel natural-input-panel">
            <div className="panel-header">
              <div className="panel-title input">
                <Wand2 size={14} />
                <span>{t.aisql.naturalLanguageQuery}</span>
              </div>
              <div className="panel-actions model-select-wrapper">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="header-model-select"
                >
                  {models.length === 0 && (
                    <option value="llama3.2">llama3.2</option>
                  )}
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <button className="panel-btn" onClick={() => setNaturalInput('')}>
                  <Trash2 size={14} />
                </button>
                <button
                  className="panel-btn"
                  onClick={() => setNaturalInput('Show me all users created in the last 7 days')}
                  title={t.aisql.exampleQuery}
                >
                  <Wand2 size={14} />
                </button>
              </div>
            </div>
            <div className="panel-content">
              <textarea
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                className="query-textarea"
                placeholder={t.aisql.describeQuery}
              />
            </div>
            <div className="panel-footer">
              <button
                className="action-btn generate-btn"
                onClick={generateSQL}
                disabled={isGenerating || !naturalInput.trim() || !schema}
              >
                {isGenerating ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
                <span>{isGenerating ? t.aisql.loading : t.aisql.generateSQL}</span>
              </button>
            </div>
          </div>

          {/* SQL Output Panel */}
          <div className="panel sql-output-panel">
            <div className="panel-header">
              <div className="panel-title output">
                <Database size={14} />
                <span>{t.aisql.generatedSQL}</span>
              </div>
              <div className="panel-actions">
                <button
                  className="panel-btn"
                  onClick={handleCopySQL}
                  disabled={!generatedSql}
                  title={t.common.copy}
                >
                  <Copy size={14} />
                </button>
                <button
                  className="action-btn execute-btn"
                  onClick={executeSQL}
                  disabled={isExecuting || !generatedSql}
                >
                  {isExecuting ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
                  <span>{isExecuting ? t.aisql.loading : t.aisql.executeQuery}</span>
                </button>
              </div>
            </div>
            <div className="panel-content">
              <textarea
                value={generatedSql}
                onChange={(e) => setGeneratedSql(e.target.value)}
                className="sql-textarea"
                placeholder="Generated SQL will appear here..."
              />
            </div>
          </div>
        </div>

        {/* Query Result */}
        {(queryExecuted || queryError) && (
          <div className="result-panel">
            <div className="panel-header">
              <div className={`panel-title ${queryError ? 'error' : ''}`}>
                {queryError ? <X size={14} /> : <Check size={14} />}
                <span>{queryError ? t.aisql.queryError : t.aisql.queryResult}</span>
              </div>
              <button className="panel-btn" onClick={() => { setQueryResult(''); setQueryError(''); setQueryExecuted(false); setQueryHeaders([]); setQueryRows([]); setQueryHasTabs(false); }}>
                <X size={14} />
              </button>
            </div>
            <div className="panel-content">
              {queryError ? (
                <div className="error-message">{queryError}</div>
              ) : queryHeaders.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {queryHeaders.map((header, idx) => (
                          <th key={idx}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="result-output">{queryResult}</pre>
              )}
            </div>
          </div>
        )}

        {/* History Button */}
        <div className="history-trigger">
          <button className="panel-btn" onClick={showHistory}>
            <History size={14} /> {t.common.history} ({history.length})
          </button>
        </div>

        <HistoryPanel
          visible={historyVisible}
          title={t.aisql.historyTitle}
          history={history}
          onClose={hideHistory}
          onClearAll={clearAllHistory}
          onDelete={deleteHistoryItem}
          onLoad={loadFromHistory}
          renderItemLabel={(item) => item.output.substring(0, 50) + (item.output.length > 50 ? '...' : '')}
          renderItemPreview={(item) => item.input}
        />
      </div>
    </Layout>
  )
}
