import vision from "@google-cloud/vision";
import * as admin from "firebase-admin";
import { onObjectFinalized } from "firebase-functions/v2/storage";

admin.initializeApp();

const db = admin.firestore();
const client = new vision.ImageAnnotatorClient();

// Simple label → category map
const MAP: Record<string, string> = {
  plastic: "plastic",
  bottle: "plastic",
  litter: "plastic",
  can: "metal",
  metal: "metal",
  tire: "bulk",
  mattress: "bulk",
  rubble: "construction",
  brick: "construction",
  concrete: "construction",
  wood: "garden",
  tree: "garden",
  grass: "garden",
};

function mapToCategory(labels: string[]): string {
  const lower = labels.map((s) => s.toLowerCase());
  for (const key of Object.keys(MAP)) {
    if (lower.some((l) => l.includes(key))) return MAP[key];
  }
  return "mixed";
}

// Auto-runs when a file is uploaded to your bucket (reports/<id>.jpg)
export const labelImageOnUpload = onObjectFinalized(
  {
    region: "africa-south1",
    bucket: "cleantown-ad312.appspot.com", // ← your real GCS bucket (not firebasestorage.app)
    timeoutSeconds: 60,
  },
  async (event) => {
    const obj = event.data;
    const filePath = obj.name || "";
    const bucketName = obj.bucket || "";

    // Only process images in reports/
    if (!filePath.startsWith("reports/")) return;

    const gcsUri = `gs://${bucketName}/${filePath}`;
    const [res] = await client.labelDetection(gcsUri);

    const labels = (res.labelAnnotations || [])
      .filter((l) => l.description && (l.score || 0) > 0.5)
      .slice(0, 6)
      .map((l) => String(l.description));

    const cat = mapToCategory(labels);

    const filename = filePath.split("/").pop() || "";
    const docId = filename.replace(/\.[^.]+$/, ""); // strip extension
    if (!docId) return;

    await db
      .collection("reports")
      .doc(docId)
      .set(
        {
          ai: {
            cat,
            labels,
            ts: admin.firestore.FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );

    console.log(`Labeled ${filePath} as ${cat}:`, labels);
  }
);
