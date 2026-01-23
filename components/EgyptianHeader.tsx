import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface EgyptianHeaderProps {
  title: string;
  subtitle?: string;
}

export function EgyptianHeader({ title, subtitle }: EgyptianHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Egyptian Flag Accent */}
      <View style={styles.flagAccent}>
        <View style={[styles.flagStripe, { backgroundColor: theme.colors.egyptian.red }]} />
        <View style={[styles.flagStripe, { backgroundColor: theme.colors.egyptian.white }]} />
        <View style={[styles.flagStripe, { backgroundColor: theme.colors.egyptian.black }]} />
      </View>

      {/* Content */}
      <LinearGradient
        colors={[theme.colors.egyptian.gold + '20', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        style={styles.content}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </LinearGradient>

      {/* Golden Accent */}
      <View style={styles.goldenLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  flagAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: 6,
    flexDirection: 'column',
  },
  flagStripe: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingRight: theme.spacing.md + 10,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  goldenLine: {
    height: 2,
    backgroundColor: theme.colors.egyptian.gold,
    opacity: 0.3,
  },
});
