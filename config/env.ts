export const env = {
  OLLAMA_API_URL: process.env.EXPO_PUBLIC_OLLAMA_API_URL || 'http://localhost:11434/api',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};
