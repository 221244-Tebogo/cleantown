import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../firebase";

export async function createReport({
  coords,
  category,
  note,
  photoUri,
}: {
  coords: { lat: number; lng: number };
  category: string;
  note: string;
  photoUri: string;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in"); // hard stop

  if (!photoUri) throw new Error("No photo selected.");

  // Expo-safe upload (URI -> Blob -> uploadBytes)
  const res = await fetch(photoUri);
  const blob = await res.blob();

  const fileName = `${Date.now()}.jpg`;
  const objectRef = ref(storage, `reports/${uid}/${fileName}`); // matches Storage rules
  await uploadBytes(objectRef, blob, { contentType: "image/jpeg" });
  const downloadURL = await getDownloadURL(objectRef);

  const docRef = await addDoc(collection(db, "reports"), {
    uid, // must exist for Firestore rules
    coords,
    category,
    note,
    photoUrl: downloadURL,
    createdAt: serverTimestamp(),
  });

  return { message: "Report submitted successfully!", id: docRef.id };
}
