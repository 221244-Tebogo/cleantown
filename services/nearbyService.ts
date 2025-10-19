import {
  collection,
  getDocs,
  orderBy,
  limit as qlimit,
  query,
  where,
} from "firebase/firestore";
import { distanceBetween, geohashQueryBounds } from "geofire-common";
import { db } from "../firebase";

export type Coords = { lat: number; lng: number };
export type ReportDoc = {
  id: string;
  coords: Coords;
  geohash: string;
  status: "open" | "maybe_gone" | "closed";
  confirmations: number;
  dismissals: number;
  photoUrl: string;
  note?: string;
};

export async function fetchNearby(
  center: Coords,
  radiusKm: number,
  perBound = 50
) {
  const bounds = geohashQueryBounds([center.lat, center.lng], radiusKm * 1000);
  const col = collection(db, "reports");

  const snaps = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(
        query(
          col,
          orderBy("geohash"),
          where("geohash", ">=", start),
          where("geohash", "<=", end),
          qlimit(perBound)
        )
      )
    )
  );

  const map = new Map<string, ReportDoc>();
  for (const s of snaps) {
    s.forEach((d) => {
      const x = d.data() as any;
      map.set(d.id, {
        id: d.id,
        coords: x.coords,
        geohash: x.geohash,
        status: x.status,
        confirmations: x.confirmations ?? 0,
        dismissals: x.dismissals ?? 0,
        photoUrl: x.photoUrl,
        note: x.note,
      });
    });
  }
  return Array.from(map.values());
}

export function withinMeters(a: Coords, b: Coords, meters: number) {
  return distanceBetween([a.lat, a.lng], [b.lat, b.lng]) * 1000 <= meters;
}
