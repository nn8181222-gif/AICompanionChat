import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCharacter } from '@/hooks/useCharacter';
import { CharacterCard } from '@/components/CharacterCard';
import { theme } from '@/constants/theme';
import { Character } from '@/contexts/CharacterContext';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { characters, currentCharacter, selectCharacter, loading } = useCharacter();

  const handleSelectCharacter = (character: Character) => {
    selectCharacter(character);
    router.push('/(tabs)');
  };

  const renderCharacter = ({ item }: { item: Character }) => (
    <CharacterCard
      character={item}
      isSelected={currentCharacter?.id === item.id}
      onPress={() => handleSelectCharacter(item)}
    />
  );

  return (
    <LinearGradient
      colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>Discover Companions</Text>
          <Text style={styles.subtitle}>Choose your AI friend</Text>
        </View>

        <FlatList
          data={characters}
          renderItem={renderCharacter}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading ? 'Loading companions...' : 'No companions available'}
              </Text>
            </View>
          }
        />
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
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface + 'CC',
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.xl,
  },
  emptyContainer: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
