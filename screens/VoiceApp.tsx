import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Share,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Voice from "@react-native-voice/voice";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import AppBackground from "../components/AppBackground";

const YELLOW = "#FBBC05";
const TEXT = "#E6EEF7";
const SUB = "#90A4B8";
const CARD = "#0E1C2C";

export default function VoiceApp() {
  const nav = useNavigation<any>();

  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  // pulse animation while listening
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (listening) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
    }
    return () => loop?.stop();
  }, [listening]);

  const playSuccess = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../assets/success-340660.mp3"));
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 400);
    } catch {}
  }, []);


  useEffect(() => {
    Voice.onSpeechStart = () => setListening(true);
    Voice.onSpeechEnd = () => setListening(false);
    Voice.onSpeechError = (e: any) => {
      setListening(false);
      if (String(e?.error?.message || "").includes("not authorized")) {
        Alert.alert("Mic permission", "Please enable microphone & speech recognition.");
      }
    };
    Voice.onSpeechResults = (e: any) => {
      const v = e?.value?.[0];
      if (typeof v === "string") setText(v);
    };
    Voice.onSpeechPartialResults = (e: any) => {
      const v = e?.value?.[0];
      if (typeof v === "string") setText(v);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const LANG = Platform.select({ ios: "en-ZA", android: "en-US", default: "en-US" });

  const startListening = async () => {
    try {
      setBusy(true);
      await Voice.start(LANG as string);
    } catch (e: any) {
      Alert.alert("Couldn’t start voice", e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const stopListening = async () => {
    try {
      setBusy(true);
      await Voice.stop();
      playSuccess();
    } catch (e: any) {
  
    } finally {
      setBusy(false);
    }
  };

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  const clearText = () => {
    setText("");
    playSuccess();
  };

  const shareText = async () => {
    if (!text.trim()) {
      Alert.alert("Nothing to share", "Say something first, then share.");
      return;
    }
    try {
      await Share.share({ message: text.trim(), title: "Transcription" });
      playSuccess();
    } catch (e: any) {
      Alert.alert("Share failed", e?.message ?? "Unknown error");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <AppBackground />
   
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[styles.micBtn, listening && styles.micBtnActive]}
            onPress={toggleListening}
            activeOpacity={0.85}
            disabled={busy}
          >
            <Ionicons name={listening ? "mic" : "mic-outline"} size={40} color="#0B0F14" />
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.meta}>
          {busy ? "Preparing…" : listening ? "Listening…" : "Tap to start"}
        </Text>
      </View>

      {/* Transcript card*/}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Transcript</Text>
        <Text style={styles.cardBody}>{text || "—"}</Text>
      </View>

    
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.btnPrimary} onPress={shareText} activeOpacity={0.95}>
          <Text style={styles.btnPrimaryText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnOutline} onPress={clearText} activeOpacity={0.9}>
          <Text style={styles.btnOutlineText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeChip}
          onPress={() => nav.navigate("Home")}
          activeOpacity={0.9}
        >
          <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
          <Text style={styles.homeChipText}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  micBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  micBtnActive: {
    // subtle ring when active
    borderWidth: 4,
    borderColor: "rgba(251,188,5,0.45)",
  },

  meta: {
    marginTop: 12,
    color: SUB,
    fontSize: 13,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    color: TEXT,
    opacity: 0.9,
    fontSize: 12,
    marginBottom: 6,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },
  cardBody: {
    color: TEXT,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 44,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  bottom: {
    paddingBottom: 20,
    gap: 10,
  },

  btnPrimary: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  btnPrimaryText: {
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
    borderColor: YELLOW,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: {
    color: YELLOW,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },

  homeChip: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: YELLOW,
  },
  homeChipText: {
    color: "#0B0F14",
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },
});

