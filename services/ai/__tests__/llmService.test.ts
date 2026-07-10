/**
 * services/ai/__tests__/llmService.test.ts
 *
 * Unit tests for services/ai/llmService.ts
 *
 * Scenarios covered:
 *  - immediate success
 *  - transient failure then success (retries with exponential backoff)
 *  - provider timeout triggering Abort (per-attempt timeout)
 *  - external signal aborted before start
 *
 * Mocks:
 *  - services/ai/index (createProvider)
 *  - ../../utils/retry (exponentialBackoff) -> returns 0 ms for deterministic behavior
 *  - ../../utils/logger (info/warn)
 */

jest.mock('../index', () => {
  return {
    createProvider: jest.fn()
  }
})

jest.mock('../../utils/retry', () => {
  return {
    exponentialBackoff: jest.fn(() => 0)
  }
})

jest.mock('../../utils/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn()
  }
})

import { generateFromPrompt } from '../llmService'
import { createProvider } from '../index'

// Type helpers for mocked createProvider
const mockedCreateProvider = createProvider as unknown as jest.Mock

describe('llmService.generateFromPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('immediate success from provider', async () => {
    const mockProvider = {
      generate: jest.fn(async (prompt: string, opts?: any) => {
        return { text: 'OK_RESPONSE', tokens: 5 }
      })
    }

    mockedCreateProvider.mockReturnValue(mockProvider)

    const res = await generateFromPrompt('hello world', { provider: 'mock', timeoutMs: 2000 })
    expect(res).toBeDefined()
    expect(res.ok).toBe(true)
    expect(res.data).toEqual({ text: 'OK_RESPONSE', tokens: 5 })
    expect(mockProvider.generate).toHaveBeenCalledTimes(1)
    expect(mockProvider.generate).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ signal: expect.any(Object) }))
  })

  test('transient failure then success using retry (exponentialBackoff mocked to 0ms)', async () => {
    let callCount = 0
    const mockProvider = {
      generate: jest.fn(async (prompt: string, opts?: any) => {
        callCount += 1
        if (callCount === 1) {
          throw new Error('transient error')
        }
        return { text: 'RECOVERED', tokens: 10 }
      })
    }

    mockedCreateProvider.mockReturnValue(mockProvider)

    const res = await generateFromPrompt('retry test', { provider: 'mock', maxRetries: 1, timeoutMs: 2000 })
    expect(res.ok).toBe(true)
    expect(res.data).toEqual({ text: 'RECOVERED', tokens: 10 })
    expect(mockProvider.generate).toHaveBeenCalledTimes(2)
  })

  test('provider does not respond and per-attempt timeout aborts request', async () => {
    const mockProvider = {
      generate: jest.fn((prompt: string, opts?: any) => {
        // Never resolve; only reject when signal is aborted
        return new Promise((_resolve, reject) => {
          const sig: AbortSignal | undefined = opts?.signal
          if (sig) {
            if (sig.aborted) {
              return reject(new Error('AbortError: already aborted'))
            }
            const onAbort = () => reject(new Error('AbortError: aborted by signal'))
            sig.addEventListener('abort', onAbort, { once: true })
          }
          // else keep hanging
        })
      })
    }

    mockedCreateProvider.mockReturnValue(mockProvider)

    const res = await generateFromPrompt('will timeout', { provider: 'mock', timeoutMs: 20, maxRetries: 0 })
    expect(res.ok).toBe(false)
    expect(res.error).toBeDefined()
    // error message should indicate abort/timeout
    expect(String(res.error)).toMatch(/abort/i)
    // provider.generate should have been called once (no retry because abort treated as non-retryable)
    expect(mockProvider.generate).toHaveBeenCalledTimes(1)
  }, 10_000) // allow some time for timer-based abort (but should be very quick)

  test('external AbortSignal aborted before start returns immediate abort error', async () => {
    const mockProvider = {
      generate: jest.fn(async (prompt: string, opts?: any) => {
        return { text: 'SHOULD_NOT_REACH', tokens: 0 }
      })
    }

    mockedCreateProvider.mockReturnValue(mockProvider)

    // create external controller and abort it before calling
    const ac = new AbortController()
    ac.abort()

    const res = await generateFromPrompt('external abort', { provider: 'mock', signal: ac.signal, timeoutMs: 2000 })
    expect(res.ok).toBe(false)
    expect(res.error).toBeDefined()
    // The implementation returns a new Error('Request aborted before start') for this case
    expect(String(res.error)).toMatch(/aborted before start/i)
    // provider.generate should not be called at all
    expect(mockProvider.generate).not.toHaveBeenCalled()
  })
})
