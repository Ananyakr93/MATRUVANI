/**
 * MATRUVANI — API Client
 *
 * Fetch wrapper with offline detection.
 * Base URL comes from VITE_API_URL env var, defaults to http://localhost:8001.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export class OfflineError extends Error {
  constructor() {
    super('You are offline. This request has been queued for later.')
    this.name = 'OfflineError'
  }
}

/**
 * Make an API request with offline detection.
 *
 * @param {string} path     - API path (e.g. '/health')
 * @param {object} options  - fetch options (method, body, headers, etc.)
 * @returns {Promise<any>}  - parsed JSON response
 * @throws {OfflineError}   - if the browser is offline
 */
export async function api(path, options = {}) {
  // Check connectivity before attempting
  if (!navigator.onLine) {
    throw new OfflineError()
  }

  const url = `${BASE_URL}${path}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Stringify body if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const res = await fetch(url, config)

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(error.detail || error.error || `HTTP ${res.status}`)
    }

    // Handle non-JSON responses (e.g. PDF)
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return res.json()
    }
    return res
  } catch (err) {
    // Network failure (DNS, timeout, etc.) — treat as offline
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new OfflineError()
    }
    throw err
  }
}

// ── Convenience methods ──────────────────────────────────────────────────

export const get = (path) => api(path, { method: 'GET' })

export const post = (path, body) => api(path, { method: 'POST', body })
