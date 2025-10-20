import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { distanceBetween, geohashQueryBounds } from "geofire-common";
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";

type UseNearbyArgs<T = any> = {
  collectionPath: string; // "reports"
  center: { lat: number; lng: number }; // map center
  kmRadius: number; // e.g. 50
  hours?: number; // keep last N hours (filter client-side)
  cap?: number; // max docs per bound (safety)
  toPoint?: (
    raw: T & { id: string }
  ) => { id: string; lat: number; lng: number; [k: string]: any } | null;
};

export function useNearby<T = any>({
  collectionPath,
  center,
  kmRadius,
  hours = 720,
  cap = 200,
  toPoint,
}: UseNearbyArgs<T>) {
  const [items, setItems] = useState<
    ({ id: string; lat: number; lng: number } & any)[]
  >([]);

  const cutoffMs = useMemo(() => Date.now() - hours * 3600 * 1000, [hours]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const bounds = geohashQueryBounds(
          [center.lat, center.lng],
          kmRadius * 1000
        );
        const promises = bounds.map(([start, end]) =>
          getDocs(
            query(
              collection(db, collectionPath),
              orderBy("geohash"),
              startAt(start),
              endAt(end),
              limit(cap)
            )
          )
        );

        const snaps = await Promise.all(promises);
        let all: any[] = [];
        for (const s of snaps) {
          s.forEach((d) => all.push({ id: d.id, ...d.data() }));
        }

        // client-side filters: age + haversine distance
        const filtered = all
          .filter((d) => {
            const createdAt = d.createdAt?.toMillis?.() ?? 0;
            return createdAt >= cutoffMs;
          })
          .map((d) => {
            const lat = d.location?.lat;
            const lng = d.location?.lng;
            if (typeof lat !== "number" || typeof lng !== "number") return null;
            const distKm = distanceBetween(
              [center.lat, center.lng],
              [lat, lng]
            );
            if (distKm > kmRadius) return null;
            const base = { id: d.id, lat, lng };
            return toPoint ? toPoint({ ...d, id: d.id }) : base;
          })
          .filter(Boolean) as any[];

        if (!cancelled) setItems(filtered);
      } catch (e) {
        console.warn("useNearby failed:", e);
        if (!cancelled) setItems([]);
      }
    }

    run();
    // re-run when center/radius changes
  }, [
    collectionPath,
    center.lat,
    center.lng,
    kmRadius,
    cap,
    cutoffMs,
    toPoint,
  ]);

  return items;
}
