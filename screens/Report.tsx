// screens/Report.tsx
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import {
  CameraView,
  useCameraPermissions,
  type CameraType,
  type FlashMode,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppBackground from "../components/AppBackground";
import { createReport } from "../services/reportCreate";

const YELLOW = "#FBBC05";

type Props = { initialNote?: string };
export default function Report({ initialNote = "" }: Props) {
  // form state
  const [note, setNote] = useState(initialNote);
  const [photo, setPhoto] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // audio record state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // ---- CAMERA ----
  const takePhoto = async () => {
    try {
      const pic = await cameraRef.current?.takePictureAsync({
        quality: 0.9,
        skipProcessing: Platform.OS === "android",
      });
      if (!pic?.uri) throw new Error("No photo URI");
      setPhoto(pic.uri);
      setIsCameraOpen(false);
    } catch (e: any) {
      Alert.alert("Camera error", e?.message || String(e));
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (lib.status !== "granted") {
          Alert.alert("Photos permission needed", "Allow access to pick an image.");
          return;
        }
      }
      // NOTE: new API uses ImagePicker.MediaType (not MediaTypeOptions) in SDK 54+
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.length) setPhoto(res.assets[0].uri);
    } catch (e: any) {
      Alert.alert("Pick image failed", e?.message || String(e));
    }
  };

  // ---- AUDIO (VOICE NOTE) ----
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Mic permission", "Please allow microphone access.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setAudio(null); // reset previous audio
      setStatus("🎙️ Recording…");
    } catch (e: any) {
      Alert.alert("Record error", e?.message ?? "Failed to start recording.");
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        setAudio(uri);
        setStatus("✅ Voice note ready");
      } else {
        setStatus("");
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (e: any) {
      setRecording(null);
      setStatus("");
      Alert.alert("Stop error", e?.message ?? "Failed to stop recording.");
    }
  };

  const clearAudio = () => {
    setAudio(null);
    setStatus("");
  };

  // ---- SUBMIT ----
  const submit = async () => {
    // Any ONE of photo / audio / note is enough
    if (!photo && !audio && !note.trim()) {
      return Alert.alert(
        "Add details",
        "Please attach a photo, record a voice note, or type a message."
      );
    }

    setStatus("Uploading 0%…");
    try {
      await createReport({
        coords: { lat: -26.2708, lng: 28.1123 }, // TODO: pass real coords
        category: "dumping",
        note: note.trim(),
        photoUri: photo || undefined,
        audioUri: audio || undefined,
        onProgress: (p) => setStatus(`Uploading ${p}%…`),
      });
      setStatus("✅ Report submitted");
      setNote("");
      setPhoto(null);
      setAudio(null);
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Failed to submit");
      Alert.alert("Submit failed", e?.message || String(e));
    }
  };

  // ---- CAMERA SHEET ----
  if (isCameraOpen) {
    if (!camPerm) return <View style={{ flex: 1, backgroundColor: "#000" }} />;
    if (!camPerm.granted) {
      return (
        <View style={s.center}>
          <Text style={s.centerMsg}>We need camera permission.</Text>
          <Pressable style={s.primary} onPress={requestCamPerm}>
            <Text style={s.btnTxt}>Grant Camera</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView
          ref={cameraRef}
          style={s.camera}
          mode="picture"
          facing={facing}
          flash={flash}
        />
        <View pointerEvents="box-none" style={s.overlay}>
          <View style={s.topBar}>
            <Pressable
              onPress={() =>
                setFlash((f) => (f === "off" ? "on" : f === "on" ? "auto" : "off"))
              }
              style={s.pill}
            >
              <Text style={s.pillTxt}>Flash: {flash.toUpperCase()}</Text>
            </Pressable>
            <Pressable
              onPress={() => setFacing((c) => (c === "back" ? "front" : "back"))}
              style={s.pill}
            >
              <Text style={s.pillTxt}>Flip</Text>
            </Pressable>
          </View>

          <View style={s.bottomBar}>
            <Pressable onPress={() => setIsCameraOpen(false)} style={s.navChip}>
              <Ionicons
                name="chevron-back"
                size={18}
                color="#0B0F14"
                style={{ marginRight: 6 }}
              />
              <Text style={s.navChipTxt}>Back</Text>
            </Pressable>
            <Pressable
              onPress={takePhoto}
              style={s.shutterOuter}
              accessibilityLabel="Take picture"
            >
              <View style={s.shutterInner} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ---- FORM ----
  return (
    <View style={s.container}>
      <AppBackground />
      <Text style={s.h}>Report Illegal Dumping</Text>

      <TextInput
        placeholder="Describe the issue… (optional if you add photo/voice)"
        value={note}
        onChangeText={setNote}
        style={s.input}
        multiline
      />

      {/* Photo preview */}
      {photo && <Image source={{ uri: photo }} style={s.preview} />}

      <View style={s.row}>
        <Pressable style={s.secondary} onPress={() => setIsCameraOpen(true)}>
          <Text style={s.btnTxt}>Take Photo</Text>
        </Pressable>
        <Pressable style={s.secondary} onPress={pickImage}>
          <Text style={s.btnTxt}>Pick from Library</Text>
        </Pressable>
      </View>

      {/* Voice note controls */}
      <View style={[s.row, { marginTop: 10 }]}>
        {recording ? (
          <Pressable style={[s.primary, { backgroundColor: "#AF2730" }]} onPress={stopRecording}>
            <Ionicons name="stop-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.btnTxt}>Stop Recording</Text>
          </Pressable>
        ) : (
          <Pressable style={s.primary} onPress={startRecording}>
            <Ionicons name="mic" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.btnTxt}>Record Voice Note</Text>
          </Pressable>
        )}

        <Pressable
          style={[s.secondary, { opacity: audio ? 1 : 0.5 }]}
          onPress={clearAudio}
          disabled={!audio}
        >
          <Text style={s.btnTxt}>Remove Audio</Text>
        </Pressable>
      </View>

      <Pressable style={[s.primary, { marginTop: 12 }]} onPress={submit}>
        <Text style={s.btnTxt}>Submit Report</Text>
      </Pressable>

      {!!status && <Text style={s.status}>{status}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  h: { fontSize: 22, fontWeight: "800", marginBottom: 10, color: "#fff", textAlign: "center" },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, minHeight: 90, color: "#000" },
  preview: { width: "100%", height: 260, borderRadius: 12, marginVertical: 16, backgroundColor: "#e9ecef" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  primary: { backgroundColor: "#2d6cdf", paddingVertical: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", flex: 1 },
  secondary: { backgroundColor: "#1f334d", paddingVertical: 12, borderRadius: 12, alignItems: "center", flex: 1 },
  btnTxt: { color: "#fff", fontWeight: "800" },
  status: { marginTop: 14, textAlign: "center", color: "#cfd8e3", fontWeight: "600" },

  // Camera overlay
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  topBar: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 16 },
  pill: { backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillTxt: { color: "#fff", fontWeight: "700" },
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingBottom: 28 },
  navChip: { backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexDirection: "row", alignItems: "center" },
  navChipTxt: { color: "#0B0F14", fontSize: 12, fontWeight: "700" },
  shutterOuter: { height: 76, width: 76, borderRadius: 999, borderWidth: 6, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  shutterInner: { height: 56, width: 56, borderRadius: 999, backgroundColor: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000", padding: 24 },
  centerMsg: { color: "#fff", marginBottom: 12, fontWeight: "700" },
});
