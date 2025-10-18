import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase";

type CreateReportArgs = {
  coords: { lat: number; lng: number };
  category: string;
  note: string;
  photoUri: string;
  onProgress?: (pct: number) => void; // 0..100
};

export async function createReport({
  coords,
  category,
  note,
  photoUri,
  onProgress,
}: CreateReportArgs) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  if (!photoUri) throw new Error("No photo selected.");

  // URI -> Blob (Expo/Web safe)
  const res = await fetch(photoUri);
  const blob = await res.blob();

  // Path must match Storage rules: reports/<uid>/<filename>
  const key = `${Date.now()}.jpg`;
  const objectRef = ref(storage, `reports/${uid}/${key}`);

  const task = uploadBytesResumable(objectRef, blob, {
    contentType: "image/jpeg",
  });
  await new Promise<string>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref))
    );
  }).then(async (downloadURL) => {
    await addDoc(collection(db, "reports"), {
      uid,
      coords,
      category,
      note,
      photoUrl: downloadURL,
      createdAt: serverTimestamp(),
    });
  });

  return { message: "Report submitted successfully!" };
}
