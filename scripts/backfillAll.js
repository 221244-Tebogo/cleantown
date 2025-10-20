// scripts/backfillAll.ts
import { backfillGeohash } from "./backfillGeohash";
import { backfillReportsOnce } from "./backfillReportsOnce";

export async function backfillAllReportsOnce() {
  console.log("⏳ Backfilling reports…");
  await backfillGeohash();
  await backfillReportsOnce();
  console.log("✅ All report backfills done.");
}
