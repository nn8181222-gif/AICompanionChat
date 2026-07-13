import { env } from '../../config/env';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

const OLLAMA_API_BASE = env.OLLAMA_API_URL;

export const ollamaClient = {
  chat: async function* (messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<OllamaChatResponse> {
    const response = await fetch(`${OLLAMA_API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        messages,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const json = JSON.parse(line);
          yield json as OllamaChatResponse;
        } catch (error) {
          console.error('Error parsing Ollama stream JSON:', error);
        }
      }
    }

    if (buffer.trim() !== '') {
      try {
        const json = JSON.parse(buffer);
        yield json as OllamaChatResponse;
      } catch (error) {
        console.error('Error parsing remaining Ollama stream JSON:', error);
      }
    }
  },

  generate: async function* (prompt: string, signal?: AbortSignal): AsyncGenerator<OllamaGenerateResponse> {
    const response = await fetch(`${OLLAMA_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader!.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const json = JSON.parse(line);
          yield json as OllamaGenerateResponse;
        } catch (error) {
          console.error('Error parsing Ollama stream JSON:', error);
        }
      }
    }

    if (buffer.trim() !== '') {
      try {
        const json = JSON.parse(buffer);
        yield json as OllamaGenerateResponse;
      } catch (error) {
        console.error('Error parsing remaining Ollama stream JSON:', error);
      }
    }
  },
};
