// screens/Report.tsx
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from "expo-camera";
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

export default function Report() {
  // form state
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

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
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.length) setPhoto(res.assets[0].uri);
    } catch (e: any) {
      Alert.alert("Pick image failed", e?.message || String(e));
    }
  };

  const submit = async () => {
    if (!photo) return Alert.alert("Missing photo", "Please attach a photo.");
    setStatus("Uploading 0%…");
    try {
      await createReport({
        coords: { lat: -26.2708, lng: 28.1123 }, // TODO: pass real coords from Location
        category: "mixed",
        note,
        photoUri: photo,
        onProgress: (p) => setStatus(`Uploading ${p}%…`),
      });
      setStatus("✅ Report submitted");
      setNote("");
      setPhoto(null);
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Failed to submit");
      Alert.alert("Submit failed", e?.message || String(e));
    }
  };

  // Camera sheet
  if (isCameraOpen) {
    if (!camPerm) return <View style={{ flex: 1, backgroundColor: "#000" }} />;
    if (!camPerm.granted) {
      return (
        <View style={s.center}>
          <Text style={s.centerMsg}>We need camera permission.</Text>
          <Pressable style={s.primary} onPress={requestCamPerm}><Text style={s.btnTxt}>Grant Camera</Text></Pressable>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {/* Camera occupies the layer */}
        <CameraView
          ref={cameraRef}
          style={s.camera}
          mode="picture"       // ✅ photo mode
          facing={facing}
          flash={flash}
        />
        {/* Overlay as sibling (NOT children of CameraView) */}
        <View pointerEvents="box-none" style={s.overlay}>
          <View style={s.topBar}>
            <Pressable onPress={() => setFlash((f) => (f === "off" ? "on" : f === "on" ? "auto" : "off"))} style={s.pill}>
              <Text style={s.pillTxt}>Flash: {flash.toUpperCase()}</Text>
            </Pressable>
            <Pressable onPress={() => setFacing((c) => (c === "back" ? "front" : "back"))} style={s.pill}>
              <Text style={s.pillTxt}>Flip</Text>
            </Pressable>
          </View>

          <View style={s.bottomBar}>
            <Pressable onPress={() => setIsCameraOpen(false)} style={s.navChip}>
              <Ionicons name="chevron-back" size={18} color="#0B0F14" style={{ marginRight: 6 }} />
              <Text style={s.navChipTxt}>Back</Text>
            </Pressable>
            <Pressable onPress={takePhoto} style={s.shutterOuter} accessibilityLabel="Take picture">
              <View style={s.shutterInner} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Form
  return (
    <View style={s.container}>
      <AppBackground />
      <Text style={s.h}>Submit a Report</Text>

      <TextInput
        placeholder="Describe the issue…"
        value={note}
        onChangeText={setNote}
        style={s.input}
        multiline
      />

      {photo && <Image source={{ uri: photo }} style={s.preview} />}

      <View style={s.row}>
        <Pressable style={s.secondary} onPress={() => setIsCameraOpen(true)}>
          <Text style={s.btnTxt}>Take Photo</Text>
        </Pressable>
        <Pressable style={s.secondary} onPress={pickImage}>
          <Text style={s.btnTxt}>Pick from Library</Text>
        </Pressable>
      </View>

      <Pressable style={[s.primary, { marginTop: 12, opacity: photo ? 1 : 0.6 }]} onPress={submit} disabled={!photo}>
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
  primary: { backgroundColor: "#2d6cdf", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
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
