// components/VoiceCapture.tsx
import { Ionicons } from "@expo/vector-icons";
import Voice from "@react-native-voice/voice";
import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const YELLOW = "#FBBC05";

type Props = {
  onCancel: () => void;
  onDone: (text: string) => void;
};

export default function VoiceCapture({ onCancel, onDone }: Props) {
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    Voice.onSpeechStart = () => setListening(true);
    Voice.onSpeechEnd   = () => setListening(false);
    Voice.onSpeechResults = (e: any) => {
      const v = e?.value?.[0];
      if (typeof v === "string") setText(v);
    };
    Voice.onSpeechPartialResults = (e: any) => {
      const v = e?.value?.[0];
      if (typeof v === "string") setText(v);
    };
    Voice.onSpeechError = (e: any) => {
      setListening(false);
      Alert.alert("Speech error", e?.error?.message ?? "Unknown");
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  const LANG = Platform.select({ ios: "en-ZA", android: "en-US", default: "en-US" });

  const start = async () => {
    try {
      setBusy(true);
      setText("");
      await Voice.start(LANG as string);
    } catch (e: any) {
      Alert.alert("Mic error", e?.message ?? "Unknown");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    try {
      setBusy(true);
      await Voice.stop();
    } catch {}
    finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.sheet}>
      <Text style={s.h}>Speak your report</Text>

      <View style={{ height: 8 }} />
      <View style={s.transcript}>
        <Text style={s.tx}>{text || "— live transcript will appear here —"}</Text>
      </View>

      <View style={s.row}>
        <TouchableOpacity style={[s.btn, s.cancel]} onPress={() => onCancel()}>
          <Text style={s.btnTxtAlt}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, listening ? s.stop : s.mic]}
          onPress={listening ? stop : start}
          disabled={busy}
        >
          <Ionicons name={listening ? "stop-circle-outline" : "mic-outline"} size={22} color="#0B0F14" />
          <Text style={s.btnTxt}>{busy ? "Please wait…" : listening ? "Stop" : "Start"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, s.done]}
          onPress={() => onDone(text.trim())}
          disabled={!text.trim()}
        >
          <Text style={s.btnTxt}>Use Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: { flex: 1, padding: 20, backgroundColor: "#0B284A", justifyContent: "center" },
  h: { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  transcript: { backgroundColor: "#0E1C2C", borderRadius: 12, padding: 14, marginTop: 12 },
  tx: { color: "#E6EEF7", fontSize: 16, lineHeight: 22, minHeight: 44 },
  row: { flexDirection: "row", gap: 10, marginTop: 16, justifyContent: "space-between" },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  mic: { backgroundColor: YELLOW },
  stop: { backgroundColor: YELLOW, borderWidth: 1, borderColor: "rgba(251,188,5,0.6)" },
  done: { backgroundColor: "#2d6cdf" },
  cancel: { backgroundColor: "#1F334D" },
  btnTxt: { color: "#0B0F14", fontWeight: "800" },
  btnTxtAlt: { color: "#E6EEF7", fontWeight: "800" },
});
