import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '@/constants/theme';

export function TypingIndicator() {
  const dot1 = React.useRef(new Animated.Value(0)).current;
  const dot2 = React.useRef(new Animated.Value(0)).current;
  const dot3 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const createAnimation = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 133);
    const anim3 = createAnimation(dot3, 266);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  const animateOpacity = (value: Animated.Value) => ({
    opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  });

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Animated.View style={[styles.dot, animateOpacity(dot1)]} />
        <Animated.View style={[styles.dot, animateOpacity(dot2)]} />
        <Animated.View style={[styles.dot, animateOpacity(dot3)]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: theme.colors.aiBubble,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});
