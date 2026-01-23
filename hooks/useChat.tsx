import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chatService';
import { chatStorageService, ChatMessage } from '@/services/chatStorageService';
import { useCharacter } from './useCharacter';

export function useChat() {
  const { currentCharacter } = useCharacter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Load messages when character changes
  useEffect(() => {
    if (currentCharacter) {
      loadMessages();
    }
  }, [currentCharacter?.id]);

  const loadMessages = async () => {
    if (!currentCharacter) return;

    setLoading(true);
    const { data, error } = await chatStorageService.getMessages(currentCharacter.id);
    
    if (error) {
      console.error('Error loading messages:', error);
    } else if (data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!currentCharacter || !text.trim()) return;

    // Save user message
    const { data: userMessage, error: saveError } = await chatStorageService.saveMessage(
      currentCharacter.id,
      text.trim(),
      'user'
    );

    if (saveError || !userMessage) {
      console.error('Error saving user message:', saveError);
      return;
    }

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);

    // Prepare messages for AI
    const conversationMessages = [
      ...messages,
      userMessage,
    ].map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.message_text,
    }));

    // Start streaming
    setIsStreaming(true);
    setStreamingContent('');
    let fullResponse = '';
    let imageUrl: string | null = null;

    await chatService.streamChat({
      messages: conversationMessages,
      characterId: currentCharacter.id,
      systemPrompt: currentCharacter.system_prompt,
      onChunk: (content) => {
        fullResponse += content;
        setStreamingContent(fullResponse);
      },
      onImageUrl: (url) => {
        imageUrl = url;
      },
      onComplete: async () => {
        setIsStreaming(false);
        setStreamingContent('');

        // Save AI response
        if (fullResponse.trim()) {
          const { data: aiMessage } = await chatStorageService.saveMessage(
            currentCharacter.id,
            fullResponse.trim(),
            'ai',
            imageUrl
          );

          if (aiMessage) {
            setMessages(prev => [...prev, aiMessage]);
          }
        }
      },
      onError: (error) => {
        console.error('Stream error:', error);
        setIsStreaming(false);
        setStreamingContent('');
      },
    });
  };

  const clearChat = async () => {
    if (!currentCharacter) return;

    const { error } = await chatStorageService.clearMessages(currentCharacter.id);
    
    if (error) {
      console.error('Error clearing chat:', error);
      return { error };
    }

    setMessages([]);
    return { error: null };
  };

  return {
    messages,
    isStreaming,
    streamingContent,
    loading,
    sendMessage,
    clearChat,
    reloadMessages: loadMessages,
  };
}
