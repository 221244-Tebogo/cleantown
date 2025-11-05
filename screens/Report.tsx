import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraType, CameraView, FlashMode, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Button,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppBackground from "../components/AppBackground";
import { createReport } from "../services/reportCreate";

const YELLOW = "#FBBC05";

export default function Report() {
  // Report form state
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // Camera view state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (lib.status !== "granted") {
          Alert.alert("Permission needed", "We need access to your photos.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert("Pick image failed", e?.message || String(e));
    }
  };

  const handleTakePhoto = useCallback(async () => {
    try {
      if (!cameraRef.current) return;
      const pic = await cameraRef.current.takePictureAsync({ quality: 1 });
      setPhoto(pic.uri); // Set photo for the report
      setIsCameraOpen(false); // Go back to the form
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to take photo.");
    }
  }, []);

  const handleSubmit = async () => {
    if (!photo) return Alert.alert("No photo", "Please attach a photo.");

    setStatus("Uploading 0%…");
    try {
      await createReport({
        coords: { lat: -25.746, lng: 28.188 }, // Placeholder coords
        category: "mixed",
        note,
        photoUri: photo,
        onProgress: (p) => setStatus(`Uploading ${p}%…`),
      });
      setStatus("✅ Report submitted successfully!");
      setNote("");
      setPhoto(null);
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Failed to submit report.");
      Alert.alert("Submit failed", e?.message || String(e));
    }
  };

  // --- Camera UI ---
  if (isCameraOpen) {
    if (!permission) return <View />;
    if (!permission.granted) {
      return (
        <View style={styles.cameraCenter}>
          <Text style={styles.info}>We need your permission to use the camera.</Text>
          <Button onPress={requestPermission} title="Grant Permission" />
        </View>
      );
    }
    return (
      <CameraView ref={cameraRef} style={styles.fill} facing={cameraFacing} flash={flash} active={isFocused}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setFlash((f) => (f === "off" ? "on" : "off"))} style={styles.pillBtn}>
            <Text style={styles.pillText}>Flash: {flash.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setCameraFacing((c) => (c === "back" ? "front" : "back"))}
            style={styles.pillBtn}
          >
            <Text style={styles.pillText}>Flip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => setIsCameraOpen(false)} style={styles.navChip}>
            <Ionicons name="chevron-back" size={18} color="#0B0F14" style={{ marginRight: 6 }} />
            <Text style={styles.navChipText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTakePhoto} style={styles.shutterOuter} activeOpacity={0.85}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  // --- Report Form UI ---
  return (
    <View style={styles.container}>
      <AppBackground />
      <Text style={styles.title}>Submit a Report</Text>
      <TextInput
        placeholder="Describe the issue..."
        value={note}
        onChangeText={setNote}
        style={styles.input}
        multiline
      />
      {photo && <Image source={{ uri: photo }} style={styles.image} />}
      <View style={styles.buttonContainer}>
        <Button title="Take Photo" onPress={() => setIsCameraOpen(true)} />
        <Button title="Pick from Library" onPress={pickImage} />
      </View>
      <View style={{ marginTop: 10, paddingHorizontal: 40 }}>
        <Button title="Submit Report" onPress={handleSubmit} disabled={!photo} color="#34C759" />
      </View>
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    backgroundColor: "#fff",
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
  },
  image: {
    width: "100%",
    height: 250,
    marginVertical: 20,
    borderRadius: 8,
    alignSelf: "center",
    backgroundColor: "#e9ecef",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 10,
  },
  status: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
  },
  // Camera Styles
  cameraCenter: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#000" },
  info: { color: "#fff", fontSize: 16, marginBottom: 12, textAlign: "center" },
  topBar: {
    position: "absolute",
    top: 40,
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  pillBtn: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  pillText: { color: "#fff", fontWeight: "600" },
  navChip: {
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  navChipText: { color: "#0B0F14", fontSize: 12, fontWeight: "500" },
  shutterOuter: {
    height: 76,
    width: 76,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { height: 56, width: 56, borderRadius: 999, backgroundColor: "#fff" },
});
