// components/ScreenWrapper.tsx
import React from 'react';
import { StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { RadialGradientBackground } from './RadialGradientBackground';
import { colors } from '@/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  withGradient?: boolean;
}

export const ScreenWrapper = ({ children, withGradient = true }: ScreenWrapperProps) => {
  if (withGradient) {
    return (
      <RadialGradientBackground>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
          {children}
        </SafeAreaView>
      </RadialGradientBackground>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, styles.plainBackground]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  plainBackground: {
    backgroundColor: colors.background,
  },
});