import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { theme } from '@/constants/theme';
import { ChatMessage } from '@/services/chatStorageService';

interface MessageBubbleProps {
  message: ChatMessage;
  characterAvatar?: string;
  isStreaming?: boolean;
  showCursor?: boolean;
}

export function MessageBubble({ message, characterAvatar, isStreaming, showCursor }: MessageBubbleProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const isUser = message.sender === 'user';

  // Cursor blinking animation
  useEffect(() => {
    if (!isStreaming) return;
    
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const handleSpeak = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    // Remove all emojis from text
    const cleanText = message.message_text.replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}]/gu,
      ''
    ).trim();

    if (!cleanText) return;

    setIsSpeaking(true);
    
    Speech.speak(cleanText, {
      pitch: 1.8,
      rate: 0.75,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {!isUser && characterAvatar && (
        <Image
          source={{ uri: characterAvatar }}
          style={styles.avatar}
          contentFit="cover"
        />
      )}
      
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.messageText}>
          {message.message_text}
          {isStreaming && cursorVisible && <Text style={styles.cursor}>▋</Text>}
        </Text>
        
        {message.image_url && (
          <Image
            source={{ uri: message.image_url }}
            style={styles.image}
            contentFit="contain"
          />
        )}

        {!isUser && !isStreaming && (
          <Pressable
            onPress={handleSpeak}
            style={({ pressed }) => [
              styles.speakerButton,
              pressed && styles.speakerButtonPressed
            ]}
          >
            <MaterialIcons
              name={isSpeaking ? 'volume-off' : 'volume-up'}
              size={16}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  bubble: {
    maxWidth: '75%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userBubble: {
    backgroundColor: theme.colors.userBubble,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: theme.colors.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    lineHeight: 22,
  },
  cursor: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
  },
  image: {
    width: '100%',
    height: 200,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  speakerButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    padding: theme.spacing.xs,
  },
  speakerButtonPressed: {
    opacity: 0.6,
  },
});
