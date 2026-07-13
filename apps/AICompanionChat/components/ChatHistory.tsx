import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, List, Divider, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { useChatStore } from '../store/chatStore';
import { chatService } from '../services/ai/chatService';
import { format } from 'date-fns';

export const ChatHistory: React.FC<{ onSelectSession: (id: string) => void }> = ({ onSelectSession }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const sessions = useChatStore((state) => Object.values(state.sessions).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
  const addSession = useChatStore((state) => state.addSession);
  const deleteSessionFromStore = useChatStore((state) => state.deleteSession);
  const currentSessionId = useChatStore((state) => state.currentSessionId);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      // For demo purposes, we're using a hardcoded user_id. In a real app, get this from auth context.
      const userId = 'default-user'; 
      const remoteSessions = await chatService.loadSessions(userId);
      remoteSessions.forEach(session => addSession(session));
      setLoading(false);
    };

    fetchSessions();
  }, [addSession]);

  const handleDelete = async (id: string) => {
    await chatService.deleteSession(id);
    deleteSessionFromStore(id);
  };

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={styles.header}>History</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelectSession(item.id)}>
            <List.Item
              title={item.title}
              description={format(item.updatedAt, 'MMM d, h:mm a')}
              left={props => <List.Icon {...props} icon="message-text-outline" />}
              right={props => (
                <IconButton
                  {...props}
                  icon="delete-outline"
                  onPress={() => handleDelete(item.id)}
                />
              )}
              style={[
                styles.listItem,
                currentSessionId === item.id && { backgroundColor: colors.primaryContainer }
              ]}
            />
            <Divider />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No history found.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
