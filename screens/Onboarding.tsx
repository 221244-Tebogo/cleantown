import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import AppBackground from "../components/AppBackground";

const { width } = Dimensions.get("window");
const KEY = "@seen_onboarding_v1";

type Slide = { id: string; title: string; subtitle: string };

const SLIDES: Slide[] = [
  { id: "1", title: "Clean Town", subtitle: "Your voice is your shield. Control safety features hands-free." },
  { id: "2", title: "Share Location", subtitle: "Quickly share your live location with trusted contacts." },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex((i) => i + 1);
    }
  };

  const playTap = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../assets/success-340660.mp3"));
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 500);
    } catch {}
  };

  const finish = async () => {
    await playTap();
    await AsyncStorage.setItem(KEY, "1");
    onDone();
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root}>
      <AppBackground />
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>

    
            <View style={styles.copyWrap}>
              <Text style={styles.h1}>{item.title}</Text>
              <Text style={styles.p}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* Footer buttons */}
      <View style={styles.footer}>
        {!isLast ? (
          <TouchableOpacity style={styles.btnOutline} onPress={next} activeOpacity={0.9}>
            <Text style={styles.btnOutlineText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={finish} activeOpacity={0.95}>
            <Text style={styles.btnText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { 
    flex: 1, 
  },

  // Bottom Nav
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: "space-between",
  },

  copyWrap: { 
    paddingBottom: 140 
  },

  h1: {
    color: "#FFFFFF",
    fontSize: 32,
    marginBottom: 10,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  p: {
    color: "#E6EEF7",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  dots: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: "#425672" 
  },

  dotActive: { 
    backgroundColor: "#141413ff", 
    width: 18 
  },

  footer: { 
    position: "absolute", 
    bottom: 24, 
    left: 24, 
    right: 24 
  },

  btn: {
    backgroundColor: "#FBBC05",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  btnText: {
    color: "#0B0F14",
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  btnOutline: {
    borderWidth: 1,
    borderColor: "#FBBC05",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  btnOutlineText: {
    color: "#FBBC05",
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },
});
