// screens/report.tsx (updated)
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { createReport, syncOfflineReports } from "../services/reportService";
import { Btn, Card, H2, Input, P, Screen } from "../src/ui";

// Feedback kit (use your alias or convert to relative paths if needed)
// If no alias, e.g. replace "@/components/..." with "../../components/..."
import BadgePop from "../components/ui/feedback/BadgePop";
import EcoPointsTicker from "../components/ui/feedback/EcoPointsTicker";
// import { COLORS } from "../components/ui/feedback/tokens";
import { useFeedback } from "../components/ui/feedback/useFeedback";

type Coords = { lat: number; lng: number };

export default function Report({ user }: { user?: { uid?: string } }) {
  const [photo, setPhoto] = useState<any | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [category, setCategory] = useState<string>("mixed");
  const [busy, setBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  // feedback
  const { showPoints, points, badgeTitle } = useFeedback();
  const [unlocked, setUnlocked] = useState(false);

  const pick = async () => {
    if (busy) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setMsg("Camera permission required.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!res.canceled) setPhoto(res.assets[0]);
  };

  const locate = async () => {
    if (busy) return;
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
        category: category?.trim() || "mixed",
        photoUri: photo.uri,
      });

      setMsg(res?.message ?? "Report submitted.");

      // success path (not queued/offline)
      if (!res?.queued) {
        // 🎉 feedback
        showPoints(50);              // +50 XP animation
        setUnlocked(true);           // badge popup
        setTimeout(() => setUnlocked(false), 1400);

        // reset form
        setPhoto(null);
        setCoords(null);
        setCategory("mixed");
      }
    } catch (e: any) {
      setMsg(e?.message || "Submit failed.");
    } finally {
      setBusy(false);
    }
  };

  const syncQueue = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { synced } = await syncOfflineReports();
      setMsg(synced ? `Synced ${synced} pending report(s).` : "No pending items.");
    } catch (e: any) {
      setMsg("Sync failed: " + (e?.message || "unknown error"));
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
          {busy ? "Please wait..." : "Take Photo"}
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

        {/* Option A: keep your classic button */}
        <Btn onPress={busy ? undefined : submit}>
          {busy ? "Submitting..." : "Submit Report"}
        </Btn>

        {/* Option B: swap to a bursty CTA (uncomment to use)
        <LeafBurstButton
          label={busy ? "Submitting..." : "Submit Report"}
          onPress={busy ? undefined : submit}
          color={COLORS.primary}
          size={56}
        />
        */}

        <View style={{ height: 8 }} />
        <Btn onPress={busy ? undefined : syncQueue}>Sync Offline Queue</Btn>

        {coords && <P>lat {coords.lat} · lng {coords.lng}</P>}
        {!!msg && <P>{msg}</P>}

        {/* Feedback overlays */}
        {points && <EcoPointsTicker add={points} color={COLORS.primary} />}
        {unlocked && <BadgePop title="Rookie Eco Hero" />}
        {badgeTitle && <BadgePop title={badgeTitle} />}

        <Pressable
  onPress={busy ? undefined : submit}
  style={{
    backgroundColor: busy ? "#9AA4AF" : "#2A7390",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  }}
>
  <Text style={{ color: "white", fontWeight: "700" }}>
    {busy ? "Submitting..." : "Submit Report"}
  </Text>
</Pressable>
      </Card>
    </Screen>
  );
}
