import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  sessions: Record<string, ChatSession>;
  currentSessionId: string | null;
  addSession: (session: ChatSession) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string | null) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: {},
      currentSessionId: null,
      addSession: (session) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [session.id]: {
              ...session,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
            },
          },
        })),
      updateSession: (sessionId, updates) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: { 
              ...state.sessions[sessionId], 
              ...updates, 
              updatedAt: new Date() 
            },
          },
        })),
      deleteSession: (sessionId) =>
        set((state) => {
          const newSessions = { ...state.sessions };
          delete newSessions[sessionId];
          return { sessions: newSessions };
        }),
      setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
      addMessageToSession: (sessionId, message) =>
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              messages: [...state.sessions[sessionId].messages, message],
              updatedAt: new Date(),
            },
          },
        })),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Fix Date objects after rehydration
        if (state) {
          Object.values(state.sessions).forEach(session => {
            session.createdAt = new Date(session.createdAt);
            session.updatedAt = new Date(session.updatedAt);
          });
        }
      },
    }
  )
);
