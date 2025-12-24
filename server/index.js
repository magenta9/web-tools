/**
 * Express server for AI SQL API
 * Handles database connections and Ollama API calls
 */

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { generateText, chatWithOllama, getModels, OLLAMA_HOST } = require('./ollama')
const { getSchema, testConnection, getDatabases, executeQuery } = require('./database')

const app = express()
const PORT = process.env.API_PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// ====================
// Ollama Routes
// ====================

/**
 * GET /api/ollama/models
 * Get available Ollama models
 */
app.get('/api/ollama/models', async (req, res) => {
  try {
    const models = await getModels()
    res.json({
      success: true,
      models,
      host: OLLAMA_HOST
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/ollama/generate
 * Generate SQL from natural language
 */
app.post('/api/ollama/generate', async (req, res) => {
  const { prompt, schema, model } = req.body

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required'
    })
  }

  try {
    // Build the full prompt with schema context
    const fullPrompt = schema
      ? `You are a MySQL expert. Based on the following database schema, write a MySQL query for the request.

Database Schema:
${schema}

Request: ${prompt}

Write only the SQL query, nothing else. Do not include markdown code blocks.`
      : prompt

    // Generate SQL with specific options for code generation
    const result = await generateText(fullPrompt, model, {
      temperature: 0.1,
      top_p: 0.9,
      num_predict: 1000
    })

    // Clean up SQL response (remove markdown code blocks if present)
    let cleanResult = result
    // Remove markdown code block markers
    cleanResult = cleanResult.replace(/```sql?/gi, '').replace(/```/g, '').trim()
    // Remove leading "sql" language indicator
    cleanResult = cleanResult.replace(/^sql\s*/i, '').trim()

    res.json({
      success: true,
      response: cleanResult
    })
  } catch (error) {
    console.error('SQL generation error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/ollama/chat
 * Chat with Ollama for explanations
 */
app.post('/api/ollama/chat', async (req, res) => {
  const { message, context } = req.body

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    })
  }

  try {
    const response = await chatWithOllama(message)
    res.json({
      success: true,
      response
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/ollama/translate
 * Translate text using Ollama with different styles
 */
app.post('/api/ollama/translate', async (req, res) => {
  const { text, sourceLang, targetLang, style, model } = req.body

  if (!text || !sourceLang || !targetLang) {
    return res.status(400).json({
      success: false,
      error: 'Text, source language, and target language are required'
    })
  }

  if (sourceLang === targetLang) {
    return res.status(400).json({
      success: false,
      error: 'Source and target languages cannot be the same'
    })
  }

  try {
    // Language mapping
    const languageNames = {
      'zh': 'Chinese',
      'en': 'English',
      'ja': 'Japanese'
    }

    const sourceLanguage = languageNames[sourceLang] || sourceLang
    const targetLanguage = languageNames[targetLang] || targetLang

    // Style-specific prompts
    let styleInstruction = ''
    switch (style) {
      case 'casual':
        styleInstruction = 'Use casual, conversational language that sounds natural and friendly. Prefer everyday expressions and colloquialisms where appropriate.'
        break
      case 'formal':
        styleInstruction = 'Use formal, professional language with precise terminology. Maintain a serious, academic tone suitable for business or official documents.'
        break
      case 'standard':
      default:
        styleInstruction = 'Use clear, natural language that is neither too casual nor overly formal. Aim for accuracy and readability.'
        break
    }

    // Construct the translation prompt
    const prompt = `You are a professional translator specializing in ${sourceLanguage}, ${targetLanguage}, and cross-cultural communication.

Task: Translate the following ${sourceLanguage} text to ${targetLanguage}.

Style Guidelines: ${styleInstruction}

Important Rules:
1. Provide ONLY the translation, no explanations or additional text
2. Maintain the original meaning and context
3. Adapt cultural references appropriately for the target audience
4. Preserve the tone and intent of the original text
5. Use natural, fluent language in the target language
6. If the text contains technical terms, translate them accurately
7. For names and proper nouns, use standard transliterations

Text to translate:
${text}

Translation:`

    // Generate translation with specific options for translation
    const translation = await generateText(prompt, model || 'llama3.2', {
      temperature: 0.2,
      top_p: 0.9,
      num_predict: 2000
    })

    // Clean up the response - remove any extra explanations
    const cleanTranslation = translation
      .replace(/^Translation:\s*/i, '')
      .replace(/^Here is the translation:\s*/i, '')
      .replace(/^The translation is:\s*/i, '')
      .trim()

    res.json({
      success: true,
      translation: cleanTranslation
    })
  } catch (error) {
    console.error('Translation error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ====================
// Database Routes
// ====================

/**
 * POST /api/db/connect
 * Test database connection
 */
app.post('/api/db/connect', async (req, res) => {
  const { host, port, user, password, database, ssl } = req.body

  if (!host || !user) {
    return res.status(400).json({
      success: false,
      error: 'Host and user are required'
    })
  }

  try {
    const result = await testConnection({ host, port, user, password, database, ssl })
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/db/databases
 * Get list of databases
 */
app.post('/api/db/databases', async (req, res) => {
  const { host, port, user, password, ssl } = req.body

  if (!host || !user) {
    return res.status(400).json({
      success: false,
      error: 'Host and user are required'
    })
  }

  try {
    const result = await getDatabases({ host, port, user, password, ssl })
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/db/schema
 * Get database schema
 */
app.post('/api/db/schema', async (req, res) => {
  const { host, port, user, password, database, ssl } = req.body

  if (!host || !user || !database) {
    return res.status(400).json({
      success: false,
      error: 'Host, user, and database are required'
    })
  }

  try {
    const result = await getSchema({ host, port, user, password, database, ssl })
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/db/execute
 * Execute a SQL query
 */
app.post('/api/db/execute', async (req, res) => {
  const { sql, host, port, user, password, database, ssl } = req.body

  if (!sql) {
    return res.status(400).json({
      success: false,
      error: 'SQL query is required'
    })
  }

  if (!host || !user || !database) {
    return res.status(400).json({
      success: false,
      error: 'Host, user, and database are required'
    })
  }

  // Security check - only allow SELECT queries for safety
  const normalizedSQL = sql.trim().toUpperCase()
  const isSelect = normalizedSQL.startsWith('SELECT') ||
    normalizedSQL.startsWith('SHOW') ||
    normalizedSQL.startsWith('DESCRIBE') ||
    normalizedSQL.startsWith('EXPLAIN') ||
    normalizedSQL.startsWith('WITH')

  if (!isSelect) {
    return res.status(400).json({
      success: false,
      error: 'Only SELECT, SHOW, DESCRIBE, EXPLAIN queries are allowed for safety'
    })
  }

  try {
    const result = await executeQuery(sql, { host, port, user, password, database, ssl })
    res.json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// ====================
// Health Check
// ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// ====================
// Start Server
// ====================

app.listen(PORT, () => {
  console.log(`AI SQL API server running on http://localhost:${PORT}`)
  console.log(`Ollama host: ${OLLAMA_HOST}`)
})

module.exports = app
