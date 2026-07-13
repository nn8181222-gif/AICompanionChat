import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export const TypingIndicator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator animating={true} color={colors.primary} size="small" />
      <Text style={[styles.text, { color: colors.onSurfaceVariant }]}>AI is typing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 8,
    marginVertical: 4,
    maxWidth: '60%',
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  text: {
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
