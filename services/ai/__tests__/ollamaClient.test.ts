import { ollamaClient } from '../ollamaClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('ollamaClient', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should handle streaming chat responses', async () => {
    const mockResponse = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ message: { content: 'Hello' }, done: false }) + '\n'));
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ message: { content: ' world' }, done: true }) + '\n'));
        controller.close();
      },
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockResponse,
    });

    const messages = [{ role: 'user' as const, content: 'Hi' }];
    const generator = ollamaClient.chat(messages);
    
    const results = [];
    for await (const chunk of generator) {
      results.push(chunk);
    }

    expect(results).toHaveLength(2);
    expect(results[0].message.content).toBe('Hello');
    expect(results[1].message.content).toBe(' world');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/chat'), expect.any(Object));
  });

  it('should handle AbortController correctly', async () => {
    const controller = new AbortController();
    (fetch as jest.Mock).mockImplementation((url, options) => {
      if (options.signal === controller.signal) {
        return Promise.reject(new Error('AbortError'));
      }
      return Promise.resolve({ ok: true });
    });

    const messages = [{ role: 'user' as const, content: 'Hi' }];
    controller.abort();

    await expect(async () => {
      const generator = ollamaClient.chat(messages, controller.signal);
      for await (const _ of generator) {}
    }).rejects.toThrow('AbortError');
  });
});
