import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Region } from "react-native-maps";
import { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppBackground from "../components/AppBackground";
import MapViewWrapper from "../components/MapViewWrapper";
import VoiceCapture from "../components/VoiceCapture";
import Report from "./Report";

import { Colors } from "../constants/theme";

type ReportPin = {
  id: string;
  lat: number;
  lng: number;
  note: string;
  ts: number;
};

export default function MapShare() {
  const insets = useSafeAreaInsets();

  const [region, setRegion] = useState<Region>({
    latitude: -26.2708,
    longitude: 28.1123,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(true);

  // Report modals
  const [showReport, setShowReport] = useState(false);
  const [reportPrefill, setReportPrefill] = useState<string>("");

  // Voice capture
  const [showVoice, setShowVoice] = useState(false);

  // Local pins created after successful report
  const [pins, setPins] = useState<ReportPin[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required to use the map.");
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion((r) => ({
          ...r,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
      } catch {
        // keep default region
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fabBottom = useMemo(
    () => Math.max(20, insets.bottom + 12),
    [insets.bottom]
  );

  // Create a pin near current GPS (fallback to map center)
  const addPinAtUser = async (note: string) => {
    let lat = region.latitude;
    let lng = region.longitude;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      lat = loc.coords.latitude;
      lng = loc.coords.longitude;
    } catch {
      // ignore; use region center
    }
    setPins((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        lat,
        lng,
        note,
        ts: Date.now(),
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <MapViewWrapper
        region={region}
        showsUserLocation
        followsUserLocation
        style={StyleSheet.absoluteFillObject as any}
        onRegionChangeComplete={(r) => setRegion(r)}
      >
        {/* render report pins */}
        {pins.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={"Reported"}
            description={`${p.note || "No note"} • ${new Date(p.ts).toLocaleTimeString()}`}
            // Simple green pin; swap to custom image if you want
            pinColor={Colors.brand}
          />
        ))}
      </MapViewWrapper>

      {/* FABs */}
      <View style={[styles.fabContainer, { bottom: fabBottom }]}>
        {/* New report */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => {
            setReportPrefill("");
            setShowReport(true);
          }}
        >
          <Ionicons name="add" size={28} color={Colors.brand} />
        </TouchableOpacity>

        {/* Voice → prefill report */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() => setShowVoice(true)}
        >
          <Ionicons name="mic-outline" size={28} color={Colors.brand} />
        </TouchableOpacity>
      </View>

      {/* Report modal */}
      <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
        <Report
          initialNote={reportPrefill}
          // ⬇️ Call this when Report has been successfully submitted.
          onSubmitted={async (note?: string) => {
            setShowReport(false);
            await addPinAtUser(note || "");
            Alert.alert("Reported", "Your report has been pinned on the map.");
          }}
        />
      </Modal>

      {/* Voice capture → opens Report with text */}
      <Modal visible={showVoice} animationType="slide" onRequestClose={() => setShowVoice(false)}>
        <VoiceCapture
          onCancel={() => setShowVoice(false)}
          onDone={(txt) => {
            setShowVoice(false);
            setReportPrefill(txt);
            setShowReport(true);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  fabContainer: {
    position: "absolute",
    right: 20,
    alignItems: "center",
    gap: 14,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.tabIcon,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
});
