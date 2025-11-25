import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, textStyles, radius, shadows } from '@/theme';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import { auth } from '@/firebase/config';

const getAuthErrorMessage = (
  code: string | undefined,
  mode: 'login' | 'signup'
) => {
  if (!code) {
    return 'Something went wrong. Please try again.';
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return mode === 'signup'
        ? 'Looks like this email already has an account. Try logging in instead.'
        : 'This email is already registered. If you forgot your password, reset it.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right. Double-check it and try again.';
    case 'auth/user-not-found':
      return 'We couldn’t find an account with that email. Try signing up first.';
    case 'auth/wrong-password':
      return 'The password doesn’t match this email. Try again or reset it.';
    case 'auth/weak-password':
      return 'Your password is too weak. Try something longer with numbers or symbols.';
    case 'auth/network-request-failed':
      return 'Network issue. Check your connection and try again.';
    default:
      return 'We hit a snag signing you in. Please try again in a moment.';
  }
};

export default function Login() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleContinue = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Missing info', 'Please enter both email and password.');
        return;
      }

      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      const message = getAuthErrorMessage(e?.code, mode);
      Alert.alert('Auth error', message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      Alert.alert(
        'Google sign-in coming soon',
        'Hook up your Google client IDs to enable 1-tap sign-in.\n\nRedirect URL:\n' +
          redirectUri
      );
    } catch (e: any) {
      Alert.alert(
        'Google sign-in error',
        e?.message ?? 'Something went wrong starting Google sign-in.'
      );
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Onboarding' as never);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top nav arrow */}
        <View style={styles.topNav}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.circleArrow}>‹</Text>
          </Pressable>
        </View>

        <View style={styles.heroWrapper}>
          <Image
            source={require('../../assets/cleaning-hero.png')}
            style={styles.hero}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Keep Your{'\n'}Town Clean</Text>
          <Text style={styles.subtitle}>Spot it. Snap it. Win.</Text>
        </View>

        <View style={styles.formBlock}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'login' ? 'Password' : 'Create a password'}
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
          />

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.bottomRow}>
          <Pressable
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.googleCircle,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.googleG}>G</Text>
          </Pressable>

          <Pressable onPress={toggleMode} style={styles.signUpButton}>
            <Text style={styles.signUpText}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.sky,
  },
  container: {
    flex: 1,
    backgroundColor: colors.sky,
    paddingHorizontal: spacing(3),
  },
  topNav: {
    marginTop: spacing(1),
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2A7390',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...shadows.sm,
  },
  circleArrow: {
    fontSize: 22,
    color: '#2A7390',
    marginTop: -1,
  },
  heroWrapper: {
    alignItems: 'center',
    marginTop: spacing(2),
  },
  hero: {
    width: 220,
    height: 220,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: spacing(2),
  },
  title: {
    ...textStyles.h2,
    textAlign: 'center',
    color: colors.ink,
    marginBottom: spacing(1),
  },
  subtitle: {
    ...textStyles.bodySmall,
    textAlign: 'center',
    color: colors.muted,
  },

  formBlock: {
    marginTop: spacing(4),
    gap: spacing(2),
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: spacing(2),
    ...textStyles.bodySmall,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadows.sm,
  },
  primaryButton: {
    marginTop: spacing(1),
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  primaryButtonText: {
    ...textStyles.body,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },

  bottomRow: {
    marginTop: 'auto',
    marginBottom: spacing(2),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(2),
  },
  googleCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.sm,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  signUpButton: {
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
  },
  signUpText: {
    ...textStyles.bodySmall,
    fontFamily: 'Poppins-SemiBold',
    color: '#2A7390',
  },
});
