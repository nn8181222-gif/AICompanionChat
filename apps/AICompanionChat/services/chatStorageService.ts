import { getSupabaseClient } from '@/template';

export interface ChatMessage {
  id: string;
  user_id: string;
  character_id: string;
  message_text: string;
  sender: 'user' | 'ai';
  image_url: string | null;
  created_at: string;
}

export const chatStorageService = {
  async getMessages(characterId: string): Promise<{ data: ChatMessage[] | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('character_id', characterId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Exception in getMessages:', err);
      return { data: null, error: err.message };
    }
  },

  async saveMessage(
    characterId: string,
    messageText: string,
    sender: 'user' | 'ai',
    imageUrl: string | null = null
  ): Promise<{ data: ChatMessage | null; error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          character_id: characterId,
          message_text: messageText,
          sender: sender,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Exception in saveMessage:', err);
      return { data: null, error: err.message };
    }
  },

  async clearMessages(characterId: string): Promise<{ error: string | null }> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('character_id', characterId);

      if (error) {
        console.error('Error clearing messages:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      console.error('Exception in clearMessages:', err);
      return { error: err.message };
    }
  },
};
