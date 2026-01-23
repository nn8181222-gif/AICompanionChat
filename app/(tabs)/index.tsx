import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { useCharacter } from '@/hooks/useCharacter';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { theme } from '@/constants/theme';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { currentCharacter } = useCharacter();
  const { messages, isStreaming, streamingContent, sendMessage, clearChat } = useChat();
  const { logout } = useAuth();
  const { showAlert } = useAlert();
  const flatListRef = useRef<FlatList>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isStreaming, streamingContent]);

  const handleClearChat = async () => {
    setShowClearModal(false);
    const { error } = await clearChat();
    if (error) {
      showAlert('Error', 'Failed to clear chat');
    } else {
      showAlert('Success', 'Chat cleared');
    }
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      showAlert('Error', error);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <MessageBubble
      message={item}
      characterAvatar={currentCharacter?.avatar}
    />
  );

  const streamingMessage = isStreaming
    ? {
        id: 'streaming',
        message_text: streamingContent,
        sender: 'ai' as const,
        image_url: null,
      }
    : null;

  return (
    <LinearGradient
      colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          {currentCharacter && (
            <>
              <Image
                source={{ uri: currentCharacter.avatar }}
                style={styles.headerAvatar}
                contentFit="cover"
              />
              <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{currentCharacter.name}</Text>
                <Text style={styles.headerPersonality}>{currentCharacter.personality}</Text>
              </View>
            </>
          )}
          
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowClearModal(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialIcons name="delete-outline" size={24} color={theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            >
              <MaterialIcons name="logout" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {currentCharacter && (
                  <>
                    <Image
                      source={{ uri: currentCharacter.avatar }}
                      style={styles.emptyAvatar}
                      contentFit="cover"
                    />
                    <Text style={styles.emptyTitle}>Chat with {currentCharacter.name}</Text>
                    <Text style={styles.emptySubtitle}>{currentCharacter.description}</Text>
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              <>
                {streamingMessage && (
                  <MessageBubble
                    message={streamingMessage}
                    characterAvatar={currentCharacter?.avatar}
                    isStreaming={true}
                    showCursor={true}
                  />
                )}
                {isStreaming && !streamingContent && <TypingIndicator />}
              </>
            }
          />

          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </KeyboardAvoidingView>

        {/* Clear Chat Modal */}
        <Modal
          visible={showClearModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClearModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowClearModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Clear Chat?</Text>
              <Text style={styles.modalMessage}>
                This will delete all messages with {currentCharacter?.name}. This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setShowClearModal(false)}
                  style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleClearChat}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonDanger,
                    pressed && styles.modalButtonPressed,
                  ]}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonDangerText]}>Clear</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface + 'CC',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  headerPersonality: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.medium,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  iconButtonPressed: {
    opacity: 0.6,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: theme.spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    minHeight: 400,
  },
  emptyAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButtonDanger: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  modalButtonPressed: {
    opacity: 0.7,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  modalButtonDangerText: {
    color: theme.colors.text,
  },
});
