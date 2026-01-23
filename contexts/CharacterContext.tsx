import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';

export interface Character {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  description: string;
  system_prompt: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
}

interface CharacterContextType {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  selectCharacter: (character: Character) => void;
  refreshCharacters: () => Promise<void>;
}

export const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching characters:', error);
        return;
      }

      if (data && data.length > 0) {
        setCharacters(data);
        
        // Set first character as default if none selected
        if (!currentCharacter) {
          setCurrentCharacter(data[0]);
        }
      }
    } catch (err) {
      console.error('Error in fetchCharacters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const selectCharacter = (character: Character) => {
    setCurrentCharacter(character);
  };

  const refreshCharacters = async () => {
    await fetchCharacters();
  };

  return (
    <CharacterContext.Provider
      value={{
        characters,
        currentCharacter,
        loading,
        selectCharacter,
        refreshCharacters,
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
}
