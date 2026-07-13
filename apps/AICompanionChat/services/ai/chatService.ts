import { supabase } from "../supabaseClient";
import { ollamaClient } from "./ollamaClient";
import { useChatStore } from "../../../store/chatStore";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export const chatService = {
  // Load sessions from Supabase
  loadSessions: async (userId: string): Promise<ChatSession[]> => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error loading chat sessions:", error);
      return [];
    }
    return data.map((session) => ({
      ...session,
      messages: JSON.parse(session.messages),
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
    }));
  },

  // Save a session to Supabase
  saveSession: async (userId: string, session: ChatSession) => {
    const { error } = await supabase.from("chat_sessions").upsert(
      {
        id: session.id,
        user_id: userId,
        title: session.title,
        messages: JSON.stringify(session.messages),
        created_at: session.createdAt.toISOString(),
        updated_at: session.updatedAt.toISOString(),
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error saving chat session:", error);
    }
  },

  // Delete a session from Supabase
  deleteSession: async (sessionId: string) => {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("Error deleting chat session:", error);
    }
  },

  // Start a new chat interaction with Ollama
  startChat: async function* (
    sessionId: string,
    messages: ChatMessage[],
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const store = useChatStore.getState();
    let fullResponseContent = "";

    try {
      for await (const chunk of ollamaClient.chat(messages, signal)) {
        if (chunk.message && chunk.message.content) {
          fullResponseContent += chunk.message.content;
          const updatedMessages = [
            ...messages,
            { role: "assistant", content: fullResponseContent },
          ];
          store.updateSession(sessionId, { messages: updatedMessages });
          yield chunk.message.content;
        }
      }
      
      // Auto-save to Supabase after completion
      const finalSession = store.sessions[sessionId];
      if (finalSession) {
        await this.saveSession("default-user", finalSession);
      }
    } catch (error) {
      console.error("Error during Ollama chat stream:", error);
      yield "Error: Unable to get a response from Ollama.";
    }
  },

  // Generate text with Ollama
  generateText: async function* (
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    let fullResponseContent = "";
    try {
      for await (const chunk of ollamaClient.generate(prompt, signal)) {
        if (chunk.response) {
          fullResponseContent += chunk.response;
          yield chunk.response;
        }
      }
    } catch (error) {
      console.error("Error during Ollama generate stream:", error);
      yield "Error: Unable to get a response from Ollama.";
    }
  },
};
