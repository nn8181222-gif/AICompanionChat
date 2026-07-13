/**
 * services/ai/llmService.ts
 * Per-attempt AbortController, combine external signal, timeout handling, retries with backoff.
 */
import { createProvider } from './index'
import type { ILLMProvider } from './providers/provider'
import { exponentialBackoff } from '../../utils/retry'
import logger from '../../utils/logger'

export interface LLMSendOptions {
  provider?: string
  maxRetries?: number
  timeoutMs?: number
  signal?: AbortSignal
  maxTokens?: number
}

export async function generateFromPrompt(prompt: string, opts: LLMSendOptions = {}) {
  const providerName = (opts.provider as any) || undefined
  const provider: ILLMProvider = createProvider(providerName)
  // maxRetries is number of retry attempts AFTER the initial try
  const maxRetries = opts.maxRetries ?? 2
  const timeoutMs = opts.timeoutMs ?? 60_000

  let attempt = 0
  let lastErr: any = null

  // If external signal already aborted, bail early
  if (opts.signal?.aborted) {
    return { ok: false, error: new Error('Request aborted before start') }
  }

  while (attempt <= maxRetries) {
    attempt += 1
    logger.info('llm.generate.attempt', { attempt, provider: providerName })

    // per-attempt AbortController to enforce per-attempt timeout
    const attemptController = new AbortController()
    const attemptSignal = attemptController.signal

    // Wire external signal to abort this attemptController if it aborts
    let removeExternalListener: (() => void) | undefined
    if (opts.signal) {
      const external = opts.signal
      const onExternalAbort = () => {
        try {
          attemptController.abort()
        } catch (_) {
          // ignore
        }
      }
      external.addEventListener('abort', onExternalAbort)
      removeExternalListener = () => external.removeEventListener('abort', onExternalAbort)
      if (external.aborted) {
        attemptController.abort()
      }
    }

    // start timeout timer for this attempt that aborts attemptController
    const timeoutId = setTimeout(() => {
      try {
        attemptController.abort()
      } catch (_) {}
    }, timeoutMs)

    try {
      const res = await provider.generate(prompt, { signal: attemptSignal, maxTokens: opts.maxTokens })
      clearTimeout(timeoutId)
      removeExternalListener?.()
      logger.info('llm.generate.success', { attempt, provider: providerName })
      return { ok: true, data: res }
    } catch (err: any) {
      clearTimeout(timeoutId)
      removeExternalListener?.()
      lastErr = err

      const isAbort = err && (err.name === 'AbortError' || /abort/i.test(String(err?.message || '')))
      logger.warn('llm.generate.error', { attempt, provider: providerName, err: String(err), aborted: isAbort })

      // If external signal aborted, stop retrying and return immediately
      if (opts.signal?.aborted) {
        return { ok: false, error: err }
      }

      // Don't retry on aborts (timeout or external)
      if (isAbort) {
        return { ok: false, error: err }
      }

      if (attempt > maxRetries) break

      // backoff before next try
      const delay = exponentialBackoff(attempt)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  return { ok: false, error: lastErr }
}

export default {
  generateFromPrompt
}
