import { getSupabaseClient } from '@/template';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamOptions {
  messages: Message[];
  characterId: string;
  systemPrompt: string;
  onChunk: (content: string) => void;
  onImageUrl: (url: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const chatService = {
  async streamChat(options: StreamOptions): Promise<void> {
    const { messages, characterId, systemPrompt, onChunk, onImageUrl, onComplete, onError } = options;

    console.log('🚀 Starting chat stream...');
    console.log('📝 Messages count:', messages.length);
    console.log('👤 Character ID:', characterId);

    try {
      const supabase = getSupabaseClient();
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onError('Not authenticated');
        return;
      }

      console.log('🔑 Auth token obtained');

      // Call Edge Function with streaming
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            characterId,
            systemPrompt,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge Function error:', response.status, errorText);
        onError(`Server error: ${errorText}`);
        return;
      }

      console.log('✅ Edge Function response received');

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback for platforms without ReadableStream support
        const fullText = await response.text();
        console.log('📄 Full response (non-streaming):', fullText);
        
        // Parse SSE format
        const lines = fullText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
              if (parsed.image_url) {
                onImageUrl(parsed.image_url);
              }
            } catch (e) {
              console.warn('⚠️ Parse error:', e);
            }
          }
        }
        
        onComplete();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream complete');
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        console.log('📦 Chunk received, buffer length:', buffer.length);

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log('🏁 Stream end marker received');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                console.log('📝 Content chunk:', parsed.content);
                onChunk(parsed.content);
              }
              
              if (parsed.image_url) {
                console.log('🖼️ Image URL received:', parsed.image_url);
                onImageUrl(parsed.image_url);
              }
            } catch (parseErr) {
              console.warn('⚠️ Parse error:', parseErr);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('❌ Chat service error:', err);
      onError(err.message || 'Failed to connect to AI service');
    }
  },
};
