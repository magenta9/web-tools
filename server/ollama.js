/**
 * Generic Ollama API client
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

/**
 * Call Ollama to generate text with specific options for code generation
 * @param {string} prompt - The prompt to send to Ollama
 * @param {string} model - Ollama model name (default: llama3.2)
 * @param {Object} options - Optional generation options
 * @returns {Promise<string>} - Generated text
 */
async function generateText(prompt, model = 'llama3.2', options = {}) {
  const defaultOptions = {
    temperature: 0.1,
    top_p: 0.9,
    num_predict: 1000,
    ...options
  }

  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: defaultOptions
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.response || ''
}

/**
 * Call Ollama for conversational/chat responses
 * @param {string} prompt - The prompt to send to Ollama
 * @param {string} model - Ollama model name
 * @param {Object} options - Optional generation options
 * @returns {Promise<string>} - Ollama's response
 */
async function chatWithOllama(prompt, model = 'llama3.2', options = {}) {
  const defaultOptions = {
    temperature: 0.3,
    num_predict: 2000,
    ...options
  }

  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: defaultOptions
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.response || ''
}


/**
 * Get available Ollama models
 * @returns {Promise<Array>} - List of available models
 */
async function getModels() {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`)
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }
    const data = await response.json()
    return data.models || []
  } catch (error) {
    console.error('Failed to get Ollama models:', error)
    return []
  }
}

module.exports = {
  generateText,
  chatWithOllama,
  getModels,
  OLLAMA_HOST
}
