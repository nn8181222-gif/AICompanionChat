import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Appbar, TextInput, IconButton, useTheme, Text, Button, Portal } from 'react-native-paper';
import { useChatStore } from '../../../store/chatStore';
import { chatService } from '../../../services/ai/chatService';
import { MessageBubble } from '../../../components/MessageBubble';
import { TypingIndicator } from '../../../components/TypingIndicator';
import { ChatHistory } from '../../../components/ChatHistory';
import { audioService } from '../../../services/audioService';
import { generateUUID } from '../../utils/uuid';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const sessions = useChatStore((state) => state.sessions);
  const addSession = useChatStore((state) => state.addSession);
  const setCurrentSession = useChatStore((state) => state.setCurrentSession);
  const addMessageToSession = useChatStore((state) => state.addMessageToSession);
  const updateSession = useChatStore((state) => state.updateSession);

  const currentSession = currentSessionId ? sessions[currentSessionId] : null;
  const messages = currentSession ? currentSession.messages : [];

  useEffect(() => {
    if (!currentSessionId) {
      // Create a new session if none exists
      const newSessionId = generateUUID();
      const newSession = {
        id: newSessionId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addSession(newSession);
      setCurrentSession(newSessionId);
    }
  }, [currentSessionId, addSession, setCurrentSession]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() === '' || !currentSessionId) return;

    const userMessage: ChatMessage = { role: 'user', content: inputMessage.trim() };
    addMessageToSession(currentSessionId, userMessage);
    setInputMessage('');
    setIsTyping(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      let assistantResponseContent = '';
      const updatedMessages = [...messages, userMessage];
      addMessageToSession(currentSessionId, { role: 'assistant', content: '' }); // Placeholder for streaming

      for await (const chunk of chatService.startChat(currentSessionId, updatedMessages, controller.signal)) {
        assistantResponseContent += chunk;
        updateSession(currentSessionId, {
          messages: [
            ...updatedMessages,
            { role: 'assistant', content: assistantResponseContent },
          ],
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Chat generation aborted by user');
        updateSession(currentSessionId, {
          messages: [
            ...messages, // Revert to messages before the aborted assistant message
            userMessage,
            { role: 'assistant', content: 'Generation aborted.' },
          ],
        });
      } else {
        console.error('Error sending message:', error);
        addMessageToSession(currentSessionId, { role: 'assistant', content: 'Sorry, something went wrong.' });
      }
    } finally {
      setIsTyping(false);
      setAbortController(null);
    }
  }, [inputMessage, currentSessionId, messages, addMessageToSession, updateSession]);

  const handleCancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsTyping(false);
      setAbortController(null);
    }
  }, [abortController]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const uri = await audioService.stopRecording();
      setIsRecording(false);
      if (uri) {
        const transcript = await audioService.transcribeAudio(uri);
        setInputMessage(transcript);
      }
    } else {
      const recording = await audioService.startRecording();
      if (recording) {
        setIsRecording(true);
      }
    }
  };

  const startNewChat = () => {
    const newSessionId = generateUUID();
    addSession({
      id: newSessionId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setCurrentSession(newSessionId);
    setShowHistory(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header mode="small">
        <Appbar.Action icon="history" onPress={() => setShowHistory(true)} />
        <Appbar.Content title={currentSession?.title || 'AI Companion Chat'} />
        <Appbar.Action icon="plus" onPress={startNewChat} />
        {isTyping && (
          <Appbar.Action icon="stop-circle-outline" onPress={handleCancelGeneration} />
        )}
      </Appbar.Header>

      <Portal>
        <Modal
          visible={showHistory}
          onDismiss={() => setShowHistory(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          <ChatHistory onSelectSession={(id) => {
            setCurrentSession(id);
            setShowHistory(false);
          }} />
          <Button mode="contained" onPress={() => setShowHistory(false)} style={styles.closeButton}>
            Close
          </Button>
        </Modal>
      </Portal>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust as needed
      >
        <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
          <TextInput
            style={styles.textInput}
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            value={inputMessage}
            onChangeText={setInputMessage}
            left={
              <TextInput.Icon 
                icon={isRecording ? "microphone" : "microphone-outline"} 
                color={isRecording ? colors.error : colors.primary}
                onPress={handleToggleRecording} 
              />
            }
            right={
              isTyping ? (
                <TextInput.Icon icon={() => <ActivityIndicator animating={true} color={colors.primary} />} />
              ) : (
                <TextInput.Icon icon="send" onPress={handleSendMessage} />
              )
            }
            onSubmitEditing={handleSendMessage}
            mode="outlined"
            multiline
            blurOnSubmit={false}
            disabled={isTyping}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    padding: 10,
  },
  closeButton: {
    margin: 10,
  },
  messageList: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  textInput: {
    flex: 1,
    marginRight: 10,
    minHeight: 40,
    maxHeight: 120, // Limit input height
  },
});
