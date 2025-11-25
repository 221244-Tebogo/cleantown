import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { geminiAI } from '@/services/geminiAI';
import { colors, spacing, textStyles, radius, shadows } from '@/theme';

const ICON_AI = require('../../assets/Ai-bot.png');
const ICON_SEND = require('../../assets/joystick.png');

const ICON_FACT = require('../../assets/lightning.png');
const ICON_STORY = require('../../assets/storybook.png');
const ICON_CHALLENGE = require('../../assets/Target.png');
const ICON_MAP = require('../../assets/green_map.png');
const ICON_TROPHY = require('../../assets/cleantown-trophy-winner.png');
const ICON_NAME = require('../../assets/mascot_celebrate.png');

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function FunAIAssistant() {
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi Eco-Hero! I’m your Cleanup Companion – I can help with missions, tips, and fun ideas to keep your city clean.",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const funPrompts: { label: string; icon: any }[] = [
    { label: 'Share a fun recycling fact', icon: ICON_FACT },
    { label: 'Give me a daily challenge', icon: ICON_CHALLENGE },
    { label: 'Tell me a cleanup story', icon: ICON_STORY },
    { label: 'What is my eco-hero name?', icon: ICON_NAME },
    { label: 'How do I level up faster?', icon: ICON_TROPHY },
    { label: 'Where should I clean next?', icon: ICON_MAP },
  ];

  useEffect(() => {
    const id = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(id);
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInputText('');
    setIsLoading(true);

    setXp((prev) => {
      const newXp = prev + 5;
      if (newXp >= level * 100) {
        setLevel((prevLevel) => prevLevel + 1);
        return 0;
      }
      return newXp;
    });

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const reply = await geminiAI.generateChatResponse(trimmed, {
        level,
        xp,
      });

      const replyText =
        typeof reply === 'string' ? reply : JSON.stringify(reply);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: replyText,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const fallback: ChatMessage = {
        role: 'assistant',
        content:
          "I'm having trouble responding right now. Try again in a moment and we can plan your next cleanup mission.",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Hi Eco-Hero! Want a mission, a tip, or something fun to try?',
      },
    ]);
    setXp(0);
    setLevel(1);
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, (xp / (level * 100)) * 100 || 0)
  );

  return (
    <View style={styles.screen}>
      {/* CIRCLE BACK BUTTON (like onboarding, dropped a bit) */}
      <View style={styles.backWrapper}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backCircle,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
      </View>

   
      <View style={styles.heroHeader}>
        <View style={styles.botIconWrap}>
          <Image source={ICON_AI} style={styles.botIcon} />
        </View>
        <Text style={styles.heroTitle}>Cleanup Companion</Text>
        <Text style={styles.heroSubtitle}>
          Chat to CleanTown AI for missions, tips, and quick wins.
        </Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>

        <Pressable onPress={clearChat} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>New chat</Text>
        </Pressable>
      </View>

    
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <View
              key={index}
              style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.aiRow,
              ]}
            >
              {!isUser && (
                <Image source={ICON_AI} style={styles.avatarSmall} />
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.aiText,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          );
        })}

        {isLoading && (
          <View style={[styles.messageRow, styles.aiRow]}>
            <Image source={ICON_AI} style={styles.avatarSmall} />
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>
                  CleanTown AI is thinking...
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

    
      <View style={styles.quickBlock}>
        <Text style={styles.quickTitle}>Tap to get started</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {funPrompts.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => sendMessage(item.label)}
              disabled={isLoading}
              style={styles.quickChip}
            >
              <Image source={item.icon} style={styles.quickChipIcon} />
              <Text style={styles.quickChipText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask CleanTown AI about missions, tips or ideas..."
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <Pressable
            onPress={() => sendMessage(inputText)}
            disabled={isLoading || !inputText.trim()}
            style={[
              styles.sendButton,
              (isLoading || !inputText.trim()) && styles.sendButtonDisabled,
            ]}
          >
            <Image source={ICON_SEND} style={styles.sendIcon} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },

  backWrapper: {
    position: 'absolute',
    top: spacing(5),
    left: spacing(3),
    zIndex: 10,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#2A7390',
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backArrow: {
    fontSize: 24,
    color: '#2A7390',
    marginTop: -2,
  },

  heroHeader: {
    marginTop: spacing(7), 
    marginHorizontal: spacing(3),
    alignItems: 'center',
    gap: spacing(0.5),
    marginBottom: spacing(3),
  },
  botIconWrap: {
    marginBottom: spacing(0.5),
  },
  botIcon: {
    width: 54,
    height: 54,
    resizeMode: 'contain',
  },
  heroTitle: {
    fontFamily: 'CherryBomb-One',
    fontSize: 32,
    color: '#2A7390',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing(3),
    marginBottom: spacing(3),
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: spacing(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  resetButton: {
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: '#FFFFFF',
  },
  resetButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.outline,
  },

  chatContainer: {
    flex: 1,
    paddingHorizontal: spacing(3),
  },
  chatContent: {
    paddingBottom: spacing(4),
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing(2),
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.homeMain,
    marginRight: spacing(1),
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
  aiText: {
    color: colors.text,
    fontFamily: 'Poppins-Regular',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: spacing(1),
    fontSize: 13,
    color: colors.muted,
    fontStyle: 'italic',
  },

  // QUICK ACTIONS
  quickBlock: {
    paddingHorizontal: spacing(3),
    marginBottom: spacing(1),
  },
  quickTitle: {
    ...textStyles.bodySmall,
    fontSize: 12,
    marginBottom: spacing(1),
  },
  quickScroll: {
    paddingBottom: spacing(1),
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    marginRight: spacing(1),
    borderWidth: 1,
    borderColor: '#C8ECF4',
  },
  quickChipIcon: {
    width: 18,
    height: 18,
    marginRight: spacing(0.5),
    resizeMode: 'contain',
  },
  quickChipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: colors.ink,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing(2),
    ...shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.muted,
  },
  sendIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});
