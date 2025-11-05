import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions, type CameraType, type FlashMode } from "expo-camera";
import React, { useRef, useState } from "react";
import { Alert, Platform, Pressable, Image as RNImage, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Camera() {
  const isFocused = useIsFocused();
  const [perm, requestPerm] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [uri, setUri] = useState<string | null>(null);

  if (!perm) return null;
  if (!perm.granted) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.msg}>We need camera permission.</Text>
        <Pressable style={s.btn} onPress={requestPerm}><Text style={s.btnTxt}>Grant</Text></Pressable>
      </SafeAreaView>
    );
  }

  const takePhoto = async () => {
    try {
      if (!ready || !cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === "android",
      });
      if (!photo?.uri) throw new Error("No URI returned");
      setUri(photo.uri);
    } catch (e: any) {
      Alert.alert("Camera error", e?.message || String(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {!uri && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          mode="picture"
          facing={facing}
          flash={flash}
          active={isFocused}           // ✅ ensure camera is active only when focused
          onCameraReady={() => setReady(true)}
        />
      )}

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {/* Top bar */}
        <View style={s.top}>
          <Pressable onPress={() => setFlash(flash === "off" ? "on" : flash === "on" ? "auto" : "off")} style={s.pill}>
            <Text style={s.pillTxt}>Flash: {flash.toUpperCase()}</Text>
          </Pressable>
          <Pressable onPress={() => setFacing(facing === "back" ? "front" : "back")} style={s.pill}>
            <Text style={s.pillTxt}>Flip</Text>
          </Pressable>
        </View>

        {/* Bottom bar */}
        <View style={s.bottom}>
          {uri ? (
            <View style={{ alignItems: "center", width: "100%" }}>
              <RNImage source={{ uri }} style={s.preview} />
              <View style={s.row}>
                <Pressable style={[s.btn, s.secondary]} onPress={() => setUri(null)}>
                  <Text style={s.btnTxt}>Retake</Text>
                </Pressable>
                {/* If you want: a Save button here using MediaLibrary */}
              </View>
            </View>
          ) : (
            <Pressable onPress={takePhoto} style={s.shutter} disabled={!ready} accessibilityLabel="Take picture">
              <View style={s.shutterInner} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B284A" },
  msg: { color: "#fff", marginBottom: 12, fontWeight: "700" },
  btn: { backgroundColor: "#2d6cdf", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnTxt: { color: "#fff", fontWeight: "800" },

  top: { paddingTop: 12, paddingHorizontal: 14, flexDirection: "row", justifyContent: "space-between" },
  pill: { backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  pillTxt: { color: "#fff", fontWeight: "700" },

  bottom: { position: "absolute", bottom: 28, alignSelf: "center", alignItems: "center", width: "100%" },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 6, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },

  preview: { width: "92%", height: 320, borderRadius: 14, backgroundColor: "#111", marginBottom: 12 },
  row: { flexDirection: "row", gap: 10 },
  secondary: { backgroundColor: "#1f334d" },
});
