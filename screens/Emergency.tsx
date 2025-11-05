import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Vibration, Platform,
  AppState, Alert, Share, SafeAreaView, Animated
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { db, auth } from "../firebase";
import { Ionicons } from "@expo/vector-icons";


type Coords = { lat: number | null; lon: number | null; accuracy?: number | null };
const CONTACTS_KEY = "@trusted_contacts_v1";

enum Phase {
  Idle = "Idle",
  Countdown = "Countdown",
  Alarm = "Alarm",
  FakeCall = "FakeCall",
  FollowUp = "FollowUp",
}

const GOOGLE_RED = "#DB4437";
const YELLOW = "#FBBC05";
const GREEN = "#34C759";
const TEXT = "#E6EEF7";
const SUB = "#BFD0E2";

const EMERGENCY_VOICE = require("../assets/EmergencyCall.mp3"); // ensure this exists

// ---- Mic pulse  ----
function MicPulse({ visible }: { visible: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (visible) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
    }
    return () => loop?.stop();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={{ alignItems: "center", transform: [{ scale }], marginTop: 6 }}>
      <Ionicons name="mic" size={20} color={YELLOW} />
      <Text style={{ color: SUB, fontSize: 12, marginTop: 2 }}>Working…</Text>
    </Animated.View>
  );
}

export default function Emergency() {
  const nav = useNavigation<any>();

  const [uid, setUid] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>(Phase.Idle);
  const [count, setCount] = useState<number>(0);
  const [coords, setCoords] = useState<Coords>({ lat: null, lon: null, accuracy: null });
  const [contacts, setContacts] = useState<string[]>([]);
  const [working, setWorking] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmSound = useRef<Audio.Sound | null>(null);
  const callSound = useRef<Audio.Sound | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);


  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(CONTACTS_KEY);
      if (raw) setContacts(raw.split(",").map((s) => s.trim()).filter(Boolean));
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude, accuracy: loc.coords.accuracy });
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => (appState.current = next));
    return () => sub.remove();
  }, []);

  const emergencyMessage = useMemo(() => {
    const parts = ["Hey, please call me back. I might be unsafe."];
    if (coords.lat && coords.lon) {
      const maps = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;
      parts.push(`My location: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)} • ${maps}`);
    }
    parts.push("If you can, I am sending you photos of the car/number plate/driver.");
    return parts.join(" ");
  }, [coords]);

  const playSuccess = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require("../assets/success-340660.mp3"));
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 500);
    } catch {}
  };

  // --- alarm / fake call controls ---
  const startAlarm = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/iphone.mp3"),
        { shouldPlay: true, isLooping: true }
      );
      alarmSound.current = sound;
      await sound.playAsync();
      Vibration.vibrate([0, 400, 200, 400], true);
    } catch {}
  };

  const stopAlarm = async () => {
    try {
      if (alarmSound.current) {
        await alarmSound.current.stopAsync();
        await alarmSound.current.unloadAsync();
        alarmSound.current = null;
      }
    } catch {}
    Vibration.cancel();
  };

  // play the fake-call voice
  const playFakeCall = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(EMERGENCY_VOICE, { shouldPlay: true, isLooping: false });
      callSound.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status?.didJustFinish) {
          sound.unloadAsync();
          setPhase(Phase.FollowUp);
        }
      });
    } catch {
      setPhase(Phase.FollowUp);
    }
  };

  const endFakeCall = async () => {
    try {
      if (callSound.current) {
        await callSound.current.stopAsync();
        await callSound.current.unloadAsync();
        callSound.current = null;
      }
    } catch {}
    playSuccess();
    setPhase(Phase.FollowUp);
  };

  const beginCountdown = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude, accuracy: loc.coords.accuracy });
      }
    } catch {}
    setCount(5);
    setPhase(Phase.Countdown);
    intervalRef.current = setInterval(() => {
      setCount((n) => {
        if (n <= 1) {
          clearInt();
          triggerSOS();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const clearInt = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const cancelCountdown = async () => {
    clearInt();
    setPhase(Phase.Idle);
    playSuccess();
  };

  const logToFirestore = async () => {
    try {
      if (!uid) return;
      await addDoc(collection(db, "users", uid, "sosEvents"), {
        createdAt: serverTimestamp(),
        lat: coords.lat ?? null,
        lon: coords.lon ?? null,
        accuracy: coords.accuracy ?? null,
        platform: Platform.OS,
        type: "SOS",
      });
    } catch {}
  };

  const triggerSMSCompose = async () => {
    if (contacts.length === 0) return;
    const to = Platform.OS === "ios" ? contacts.join(",") : contacts[0];
    const url = `sms:${to}?body=${encodeURIComponent(emergencyMessage)}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch {}
  };

  const triggerSOS = async () => {
    await startAlarm();
    await logToFirestore();
    setPhase(Phase.Alarm);
  };

  const handleImSafe = async () => {
    await stopAlarm();
    setPhase(Phase.FakeCall);
    playSuccess();
    await playFakeCall();
  };


  const capturePhotoInline = async () => {
    setWorking(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera permission needed");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.[0]?.uri) {
        try {
          await Share.share({
            title: "Car evidence",
            message: emergencyMessage,
            url: result.assets[0].uri,
          });
          playSuccess();
        } catch (e) {
          Alert.alert("Share failed", String(e));
        }
      }
    } finally {
      setWorking(false);
    }
  };

 //Bottom nav
  const quickShareLocation = async () => {
    setWorking(true);
    try {
      let lat = coords.lat, lon = coords.lon;
      if (!lat || !lon) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
          setCoords({ lat, lon, accuracy: loc.coords.accuracy });
        }
      }
      if (!lat || !lon) {
        Alert.alert("Location not available", "Try again in a few seconds.");
        return;
      }
      const url = `https://www.google.com/maps?q=${lat},${lon}`;
      await Share.share({ title: "Share Location", message: `Here's my location: ${url}`, url });
      playSuccess();
    } finally {
      setWorking(false);
    }
  };

  const quickOpenCamera = () => {

    nav.navigate("Camera");
  };

  const messagePartner = async () => {
    setWorking(true);
    try {
      await triggerSMSCompose();
      playSuccess();
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    return () => {
      clearInt();
      stopAlarm();
      if (callSound.current) callSound.current.unloadAsync();
    };
  }, []);

  const coordsLabel =
    coords.lat && coords.lon
      ? `Ready • ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
      : "Getting location…";

  return (
    <SafeAreaView style={styles.root}>
      {/* Center content*/}
      {phase === Phase.Idle && (
        <View style={styles.center}>
          <TouchableOpacity style={styles.sosBtn} onPress={beginCountdown} activeOpacity={0.85}>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          <Text style={styles.meta}>{coordsLabel}</Text>
        </View>
      )}

      {phase === Phase.Countdown && (
        <View style={styles.center}>
          <Text style={styles.label}>Sending SOS in</Text>
          <Text style={styles.big}>{count}</Text>
        </View>
      )}

      {phase === Phase.Alarm && (
        <View style={styles.center}>
          <Text style={styles.label}>Incoming Call</Text>
        </View>
      )}

      {phase === Phase.FakeCall && (
        <View style={styles.center}>
          <Text style={styles.label}>On call… “Are you safe? Send photos to ICE.”</Text>
        </View>
      )}

      {phase === Phase.FollowUp && (
        <View style={styles.center}>
          <Text style={styles.label}>Follow up</Text>
        </View>
      )}

    
      <View style={styles.bottom}>
        {phase === Phase.Countdown && (
          <TouchableOpacity style={styles.btnOutlineDestructive} onPress={cancelCountdown} activeOpacity={0.9}>
            <Text style={styles.btnOutlineDestructiveText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {phase === Phase.Alarm && (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleImSafe} activeOpacity={0.95}>
            <Text style={styles.btnPrimaryText}>Feeling Unsafe? (Press & Follow instructions)</Text>
          </TouchableOpacity>
        )}

        {phase === Phase.FakeCall && (
          <View style={styles.callRow}>
            {/* Green "connected" icon (disabled) */}
            <View style={[styles.callBtn, styles.callBtnGreen, styles.callBtnDisabled]}>
              <Ionicons name="call" size={22} color="#FFFFFF" />
            </View>
            {/* Red "end call" icon */}
            <TouchableOpacity style={[styles.callBtn, styles.callBtnRed]} onPress={endFakeCall} activeOpacity={0.85}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {phase === Phase.FollowUp && (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={capturePhotoInline} activeOpacity={0.95}>
              <Text style={styles.btnPrimaryText}>Open Camera (Share Location/ Number Plate)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={messagePartner} activeOpacity={0.9}>
              <Text style={styles.btnOutlineText}>Message Loved One</Text>
            </TouchableOpacity>
          </>
        )}

 
        <View style={styles.utilityRow}>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickBtn} onPress={quickShareLocation} activeOpacity={0.85}>
              <Ionicons name="location-outline" size={18} color="#0B0F14" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={quickOpenCamera} activeOpacity={0.85}>
              <Ionicons name="camera-outline" size={18} color="#0B0F14" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.homeChip} onPress={() => nav.navigate("Home")} activeOpacity={0.9}>
            <Ionicons name="home-outline" size={16} color="#0B0F14" style={{ marginRight: 6 }} />
            <Text style={styles.homeChipText}>Home</Text>
          </TouchableOpacity>
        </View>

        <MicPulse visible={working} />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "transparent" 
  },

  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    paddingHorizontal: 24 
  },

  label: {
    color: TEXT,
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },

  big: {
    color: "#FFFFFF",
    fontSize: 72,
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  meta: {
    marginTop: 16,
    color: SUB,
    fontSize: 12,
    fontFamily: Platform.select({
      ios: "Poppins-Regular",
      android: "Poppins_400Regular",
      default: "Poppins_400Regular",
    }),
  },

  sosBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: GOOGLE_RED,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },

  sosText: {
    color: "#fff",
    fontSize: 56,
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: "Poppins-SemiBold",
      android: "Poppins_600SemiBold",
      default: "Poppins_600SemiBold",
    }),
  },

  bottom: { 
    paddingHorizontal: 16, 
    paddingBottom: 20, 
    gap: 12 
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

  btnOutlineDestructive: {
    borderWidth: 1,
    borderColor: GOOGLE_RED,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  btnOutlineDestructiveText: {
    color: GOOGLE_RED,
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "Poppins-Medium",
      android: "Poppins_500Medium",
      default: "Poppins_500Medium",
    }),
  },

  callRow: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 24, 
    paddingTop: 4 
  },

  callBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  callBtnGreen: { backgroundColor: GREEN },
  callBtnRed: { backgroundColor: GOOGLE_RED },
  callBtnDisabled: { opacity: 0.5 },

  // Bottom utility row
  utilityRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginTop: 6 
  },

  quickRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10 
  },

  quickBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: YELLOW,
  },

  homeChip: {
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
