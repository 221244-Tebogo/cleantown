import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { geohashForLocation } from "geofire-common";
import { db } from "../firebase";

export async function backfillGeohash() {
  const snap = await getDocs(collection(db, "reports"));
  const updates: Promise<any>[] = [];

  snap.forEach((d) => {
    const data: any = d.data();
    const lat =
      data.location?.lat ??
      data.location?.latitude ??
      data.lat ??
      data.latitude;
    const lng =
      data.location?.lng ??
      data.location?.longitude ??
      data.lng ??
      data.longitude;

    if (typeof lat === "number" && typeof lng === "number") {
      const geohash = data.geohash || geohashForLocation([lat, lng]);
      updates.push(
        updateDoc(doc(db, "reports", d.id), {
          location: { lat, lng },
          geohash,
        })
      );
    }
  });

  await Promise.all(updates);
  console.log("✅ Backfill complete.");
}
