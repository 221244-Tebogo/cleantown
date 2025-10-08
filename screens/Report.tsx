import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Image, View } from "react-native";
import { Screen, Card, H2, P, Btn } from "../src/ui";
import { createReport, syncOfflineReports } from "../services/reportService";

export default function Report({ user }) {
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [category, setCategory] = useState("mixed");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const pick = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setMsg("Camera permission required.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!res.canceled) setPhoto(res.assets[0]);
  };

  const locate = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setMsg("Location permission required.");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setCoords({
      lat: +pos.coords.latitude.toFixed(6),
      lng: +pos.coords.longitude.toFixed(6),
    });
  };

  const submit = async () => {
    if (!photo || !coords) {
      setMsg("Photo + location required.");
      return;
    }
    setBusy(true);
    try {
      const res = await createReport({
        userId: user?.uid,
        coords,
        category,
        photoUri: photo.uri,
      });
      setMsg(res.message);
      if (!res.queued) {
        setPhoto(null);
        setCoords(null);
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const syncQueue = async () => {
    setBusy(true);
    try {
      const { synced } = await syncOfflineReports();
      setMsg(synced ? `Synced ${synced} pending report(s).` : "No pending items.");
    } catch (e) {
      setMsg("Sync failed: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <H2>Report Illegal Dumping</H2>
        <P>Attach a photo and capture your GPS position.</P>
      </Card>

      <Card>
        {photo ? (
          <Image
            source={{ uri: photo.uri }}
            style={{ height: 180, borderRadius: 12, marginBottom: 10 }}
          />
        ) : null}
        <Btn onPress={pick} style={{ marginBottom: 10 }}>
          Take Photo
        </Btn>
        <Btn onPress={locate} style={{ marginBottom: 10 }}>
          Use My Location
        </Btn>
        <Input
          value={category}
          onChangeText={setCategory}
          placeholder="Category (mixed / plastic / cans / rubble)"
        />
        <View style={{ height: 8 }} />
        <Btn onPress={submit}>{busy ? "Submitting..." : "Submit Report"}</Btn>
        <View style={{ height: 8 }} />
        <Btn onPress={syncQueue}>Sync Offline Queue</Btn>
        {coords && <P>lat {coords.lat} · lng {coords.lng}</P>}
        {msg ? <P>{msg}</P> : null}
      </Card>
    </Screen>
  );
}
