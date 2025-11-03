// src/hooks/useCurrentRegion.ts
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import type { Region } from "react-native-maps";

const DEFAULT_REGION: Region = {
  latitude: -26.2041, // JHB fallback
  longitude: 28.0473,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Convert meters → map deltas (lon adjusts by latitude)
export function metersToDelta(meters: number, latitude: number) {
  const latDelta = meters / 111_320; // ~1° lat = 111.32 km
  const lonDelta = meters / (111_320 * Math.cos((latitude * Math.PI) / 180));
  return {
    latitudeDelta: Math.max(0.002, latDelta),
    longitudeDelta: Math.abs(lonDelta),
  };
}

export function useCurrentRegion(targetAccuracyMeters = 50) {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    (async () => {
      try {
        setError(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setReady(true); // render with fallback region
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });

        const { latitude, longitude, accuracy } = current.coords;
        const deltas = metersToDelta(
          Math.max(accuracy ?? targetAccuracyMeters, targetAccuracyMeters),
          latitude
        );

        if (!mounted.current) return;
        setRegion({ latitude, longitude, ...deltas });
        setReady(true);

        // Live updates
        watchSub.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 25,
            timeInterval: 3000,
          },
          (pos) => {
            if (!mounted.current) return;
            const { latitude, longitude, accuracy } = pos.coords;
            const deltas = metersToDelta(
              Math.max(accuracy ?? targetAccuracyMeters, targetAccuracyMeters),
              latitude
            );
            setRegion((r) => ({ ...r, latitude, longitude, ...deltas }));
          }
        );
      } catch (e: any) {
        if (!mounted.current) return;
        setError(e?.message || String(e));
        setReady(true);
      }
    })();

    return () => {
      mounted.current = false;
      // Important: remove via the subscription, not LocationEventEmitter
      try {
        watchSub.current?.remove?.();
      } finally {
        watchSub.current = null;
      }
    };
  }, [targetAccuracyMeters]);

  return { region, ready, error };
}
