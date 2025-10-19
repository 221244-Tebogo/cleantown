import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import { Coords, fetchNearby, ReportDoc, withinMeters } from "../services/nearbyService";
import { confirmReport, dismissReport } from "../services/reportConfirmations";


const ALERT_DISTANCE_M = 300;     // when to ask “Still there?”
const MOVE_THRESHOLD_M = 100;     // re-query if moved this far
const CLOSE_DELTA = 3;            // auto-close if dismissals-confirmations >= 3

type Mode = "auto" | "drive" | "walk" | "off";

export default function Alerts() {
  const [pos, setPos] = useState<Coords | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<Mode>("auto");

  const alertedIds = useRef<Set<string>>(new Set()); // session anti-spam
  const lastQueryPos = useRef<Coords | null>(null);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  // Pick cadence & query size based on mode/speed
  const profileForSpeed = (speedMps?: number) => {
    // > 6 m/s ≈ > 21.6 km/h => likely driving
    const driving = (speedMps ?? 0) > 6;
    if (mode === "drive" || (mode === "auto" && driving)) {
      return { timeInterval: 8000, distanceInterval: 60, queryKm: 3 };
    }
    if (mode === "walk" || (mode === "auto" && !driving)) {
      return { timeInterval: 25000, distanceInterval: 120, queryKm: 1 };
    }
    // off
    return { timeInterval: 60000, distanceInterval: 1000, queryKm: 0.1 };
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location required", "Enable location to get nearby litter alerts.");
        return;
      }

      // Start watcher
      watcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 60,
        },
        (p) => {
          setPos({
            lat: +p.coords.latitude.toFixed(6),
            lng: +p.coords.longitude.toFixed(6),
          });
          // adapt cadence by speed if auto
          const prof = profileForSpeed(p.coords.speed ?? 0);
          if (watcher.current) {
            // @ts-ignore expo allows changing options by re-subscribing; keep MVP simple
          }
        }
      );
    })();

    return () => watcher.current?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!enabled || !pos) return;

    const doQuery = async () => {
      const last = lastQueryPos.current;
      if (last && distanceMeters(last, pos) <= MOVE_THRESHOLD_M) return;
      lastQueryPos.current = pos;

      // pick radius
      const prof = profileForSpeed(undefined); // mode-based when speed not provided
      const radiusKm = prof.queryKm;

      const items = await fetchNearby(pos, radiusKm, 60);
      // filter relevant + not already alerted
      const candidates = items.filter(
        (r) =>
          r.status !== "closed" &&
          withinMeters(pos, r.coords, ALERT_DISTANCE_M) &&
          !alertedIds.current.has(r.id)
      );

      for (const r of candidates) {
        alertedIds.current.add(r.id);
        askUser(r);
      }
    };

    // quick immediate check
    doQuery();
    // plus a small cadence to re-evaluate while moving
    const t = setInterval(doQuery, 12000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, enabled, mode]);

  const askUser = (r: ReportDoc) => {
    Alert.alert(
      "Litter reported nearby",
      "Is the dumping still here?",
      [
        {
          text: "Gone",
          onPress: async () => {
            await dismissReport(r.id);
            // Optional auto-close heuristic:
            // fetch counts if you keep them fresh in state; here we assume client will refetch.
            // You can also move this logic to a Cloud Function on votes.
          },
        },
        {
          text: "Still here",
          onPress: async () => {
            await confirmReport(r.id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ padding: 16, gap: 10 }}>
      <Text style={{ fontWeight: "600", fontSize: 16 }}>Drive Alerts</Text>
      <Text>{enabled ? "Active" : "Paused"}{pos ? ` @ ${pos.lat}, ${pos.lng}` : ""}</Text>

      {/* Simple mode toggles (optional) */}
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}>
        <Text>Enabled</Text>
        <Switch value={enabled} onValueChange={setEnabled} />
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <ModePill label="Auto"  active={mode==="auto"}  onPress={() => setMode("auto")} />
        <ModePill label="Drive" active={mode==="drive"} onPress={() => setMode("drive")} />
        <ModePill label="Walk"  active={mode==="walk"}  onPress={() => setMode("walk")} />
        <ModePill label="Off"   active={mode==="off"}   onPress={() => setMode("off")} />
      </View>
    </View>
  );
}

function ModePill({ label, active, onPress }:{label:string;active:boolean;onPress:()=>void}) {
  return (
    <Text
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#111" : "#bbb",
        fontWeight: active ? "700" : "500",
      }}
    >
      {label}
    </Text>
  );
}

function distanceMeters(a: Coords, b: Coords) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}
