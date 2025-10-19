// Report.tsx
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, Button, Image, Platform, Text, TextInput, View } from "react-native";
import { createReport } from "../services/reportCreate";

export default function Report() {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const getMediaTypes = () => {
    const anyPicker: any = ImagePicker;
    return anyPicker?.MediaType?.image ? [anyPicker.MediaType.image] : anyPicker.MediaTypeOptions?.Images;
  };

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
        mediaTypes: getMediaTypes(),
        allowsEditing: true,
        quality: 0.7,
      } as any);
      if (!result.canceled && result.assets?.length > 0) setPhoto(result.assets[0].uri);
    } catch (e: any) {
      Alert.alert("Pick image failed", e?.message || String(e));
    }
  };

  const handleSubmit = async () => {
    if (!photo) return Alert.alert("No photo", "Please attach a photo.");

    setStatus("Uploading 0%…");
    try {
      await createReport({
        coords: { lat: -25.746, lng: 28.188 },
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

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Submit a Report</Text>
      <TextInput
        placeholder="Describe the issue..."
        value={note}
        onChangeText={setNote}
        style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 5 }}
      />
      {photo && <Image source={{ uri: photo }} style={{ width: 200, height: 200, marginVertical: 10 }} />}
      <Button title="Pick Image" onPress={pickImage} />
      <Button title="Submit Report" onPress={handleSubmit} />
      {!!status && <Text style={{ marginTop: 10 }}>{status}</Text>}
    </View>
  );
}
