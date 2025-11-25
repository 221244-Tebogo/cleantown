import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, textStyles, shadows } from '@/theme';

const { width, height } = Dimensions.get('window');

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: any;
};

const SLIDES: Slide[] = [
  {
    key: 'report',
    title: 'Report Litter Easily',
    subtitle: 'Turn litter sightings into instant reports in seconds.',
    image: require('../../assets/Onboarding.png'),
  },
  {
    key: 'cleanups',
    title: 'Join cleanups near you',
    subtitle: 'Connect with volunteers and transform your city together.',
    image: require('../../assets/Onboarding-1.png'),
  },
  {
    key: 'rewards',
    title: 'Earn Rewards Points',
    subtitle: 'Get recognised, collect points, and climb the leaderboard.',
    image: require('../../assets/Onboarding-2.png'),
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  };

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      navigation.navigate('AuthStack' as never); // keep onboarding in history
    }
  };

  const skip = () => {
    navigation.navigate('AuthStack' as never);
  };

  return (
    <View style={styles.container}>
      {/* slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <ImageBackground
              source={item.image}
              style={styles.imageBg}
              resizeMode="cover"
            >
              {/* bottom text over the colour area */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </ImageBackground>
          </View>
        )}
      />

      {/* TOP NAV: arrow + skip (like your example) */}
      <View style={styles.topNav}>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.circleButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          {/* simple chevron, pointing right */}
          <Text style={styles.circleArrow}>›</Text>
        </Pressable>

        {index < SLIDES.length - 1 && (
          <Pressable onPress={skip} style={styles.skipTop}>
            <Text style={styles.skipTopText}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* BOTTOM: dots only */}
      <View style={styles.bottomDots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const BOTTOM_TEXT_OFFSET = spacing(10);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sky,
  },
  slide: {
    width,
    height,
  },
  imageBg: {
    flex: 1,
  },
  textContainer: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    bottom: BOTTOM_TEXT_OFFSET,
    alignItems: 'center',
  },
title: {
  ...textStyles.h2,           
  textAlign: 'center',
  color: colors.text,       
  marginBottom: spacing(0.75), 
},

  subtitle: {
    ...textStyles.bodySmall,
    textAlign: 'center',
    color: '#FFFFFF',
  },

  topNav: {
    position: 'absolute',
    top: spacing(4), // higher up, in the “sky”
    left: spacing(3),
    right: spacing(3),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleButton: {
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
  circleArrow: {
    fontSize: 24,
    color: '#2A7390',
    marginTop: -2,
  },
  skipTop: {
    paddingHorizontal: spacing(1),
    paddingVertical: spacing(0.5),
  },
  skipTopText: {
    ...textStyles.bodySmall,
    color: '#2A7390',
  },

  /* bottom dots only */
  bottomDots: {
    position: 'absolute',
    bottom: spacing(3),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
});
