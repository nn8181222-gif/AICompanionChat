import type { ILLMProvider } from './provider'
import { CONFIG } from '../../../config'

const DEFAULT_URL = 'http://localhost:11434/api/generate'

export default class OllamaProvider implements ILLMProvider {
  private url: string
  private model?: string

  constructor() {
    this.url = (CONFIG.OLLAMA_URL as string) || DEFAULT_URL
    this.model = (CONFIG.OLLAMA_MODEL as string) || 'llama3'
  }

  async generate(prompt: string, options?: { signal?: AbortSignal; maxTokens?: number }) {
    // force stream: false to avoid streaming parse complexity
    const payload: any = { prompt, stream: false }
    if (this.model) payload.model = this.model

    if (typeof options?.maxTokens === 'number') {
      payload.options = {
        num_predict: options.maxTokens
      }
    }

    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: options?.signal
    })

    const raw = await res.text()

    let parsed: any = null
    const contentType = (res.headers.get('content-type') || '').toLowerCase()
    if (contentType.includes('application/json')) {
      try {
        parsed = JSON.parse(raw)
      } catch (e) {
        parsed = null
      }
    }

    let text: string = ''
    if (parsed !== null) {
      // prefer official Ollama fields then fallbacks
      if (parsed.response) {
        text = String(parsed.response)
      } else if (typeof parsed === 'string') {
        text = parsed
      } else if (parsed.text) {
        text = String(parsed.text)
      } else if (parsed.generated_text) {
        text = String(parsed.generated_text)
      } else if (parsed.output) {
        text = String(parsed.output)
      } else {
        text = JSON.stringify(parsed)
      }
    } else {
      text = raw
    }

    if (!res.ok) {
      const snippet = text.slice(0, 1000)
      throw new Error(`OllamaProvider: HTTP ${res.status} ${res.statusText} - ${snippet}`)
    }

    let tokens: number | undefined = undefined
    if (parsed) {
      if (typeof parsed.eval_count === 'number') tokens = parsed.eval_count
      else if (typeof parsed.tokens === 'number') tokens = parsed.tokens
    }

    return { text, tokens }
  }

  async health() {
    try {
      const idx = this.url.indexOf('/api/')
      const base = idx === -1 ? this.url : this.url.slice(0, idx)
      const rootUrl = base.replace(/\/$/, '')

      // Use AbortController + setTimeout for backwards compatibility
      const controller = new AbortController()
      const timeoutMs = 5000
      const timeoutId = setTimeout(() => {
        try {
          controller.abort()
        } catch (_) {}
      }, timeoutMs)

      try {
        const res = await fetch(rootUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        })
        return res.ok
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (e) {
      return false
    }
  }
}
