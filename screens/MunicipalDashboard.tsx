// screens/MunicipalDashboard.tsx
import { getApp } from "firebase/app";
import {
    DocumentData,
    QueryDocumentSnapshot,
    Timestamp,
    collection,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    startAfter,
    where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, Text, TextInput, View } from "react-native";

type Report = {
  id: string;
  createdAt: Timestamp;
  category: string;        // e.g., "Illegal dumping", "Litter", "Blocked drain"
  status: "new" | "acknowledged" | "assigned" | "resolved";
  ward?: string;           // e.g., "Ward 23"
  description?: string;
  photoUrl?: string;
  location?: { lat: number; lng: number; geohash?: string };
  reporterUid?: string;
  assignedToUid?: string;  // municipal officer uid
};

const PAGE = 20;

export default function MunicipalDashboard() {
  const db = getFirestore(getApp());
  const functions = getFunctions(getApp());

  // Filters
  const [ward, setWard] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [from, setFrom] = useState<string>(""); // yyyy-mm-dd
  const [to, setTo] = useState<string>("");     // yyyy-mm-dd
  const [statusFilter, setStatusFilter] = useState<Report["status"] | "all">("all");

  // Data + paging
  const [reports, setReports] = useState<Report[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);

  // Build Firestore query based on filters
  const q = useMemo(() => {
    const col = collection(db, "reports");
    const clauses: any[] = [orderBy("createdAt", "desc"), limit(PAGE)];
    // where()s must precede orderBy when combined with inequality filters; we stick to equality + date range
    let base: any = col;

    const w: any[] = [];
    if (ward.trim()) w.push(where("ward", "==", ward.trim()));
    if (category.trim()) w.push(where("category", "==", category.trim()));
    if (statusFilter !== "all") w.push(where("status", "==", statusFilter));

    // Date range
    if (from) w.push(where("createdAt", ">=", Timestamp.fromDate(new Date(`${from}T00:00:00`))));
    if (to)   w.push(where("createdAt", "<=", Timestamp.fromDate(new Date(`${to}T23:59:59`))));

    return query(base, ...w, ...clauses);
  }, [db, ward, category, statusFilter, from, to]);

  // Live subscribe (first page)
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const rows: Report[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setReports(rows);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [q]);

  // Derived summary counts
  const counts = useMemo(() => {
    const by: Record<Report["status"], number> = { new: 0, acknowledged: 0, assigned: 0, resolved: 0 };
    reports.forEach((r) => { by[r.status] = (by[r.status] ?? 0) + 1; });
    return by;
  }, [reports]);

  // Load more (next page)
  const loadMore = async () => {
    if (!lastDoc) return;
    const col = collection(db, "reports");
    const w: any[] = [];
    if (ward.trim()) w.push(where("ward", "==", ward.trim()));
    if (category.trim()) w.push(where("category", "==", category.trim()));
    if (statusFilter !== "all") w.push(where("status", "==", statusFilter));
    if (from) w.push(where("createdAt", ">=", Timestamp.fromDate(new Date(`${from}T00:00:00`))));
    if (to)   w.push(where("createdAt", "<=", Timestamp.fromDate(new Date(`${to}T23:59:59`))));

    const q2 = query(col, ...w, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(PAGE));
    onSnapshot(q2, (snap) => {
      const extra: Report[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setReports((curr) => [...curr, ...extra]);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    });
  };

  // Actions via secure Cloud Functions
  const acknowledge = async (reportId: string) => {
    const call = httpsCallable(functions, "updateReportStatus");
    await call({ reportId, status: "acknowledged" });
  };
  const resolve = async (reportId: string) => {
    const call = httpsCallable(functions, "updateReportStatus");
    await call({ reportId, status: "resolved" });
  };
  const assignTo = async (reportId: string, officerUid: string) => {
    const call = httpsCallable(functions, "assignReport");
    await call({ reportId, officerUid });
  };

  // UI helpers
  const Tile = ({ label, value, active, onPress }: { label: string; value: number; active?: boolean; onPress?: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? "#2A7390" : "#0B284A",
        padding: 12, borderRadius: 14, marginRight: 8,
      }}>
      <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{value}</Text>
      <Text style={{ color: "white", opacity: 0.8 }}>{label}</Text>
    </Pressable>
  );

  const FilterInput = ({ placeholder, value, onChangeText, style }: any) => (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#8AA5B6"
      value={value}
      onChangeText={onChangeText}
      style={{
        flex: 1, minWidth: 120,
        borderWidth: 1, borderColor: "#24445C", borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: Platform.OS === "ios" ? 10 : 8,
        color: "white", backgroundColor: "rgba(7,25,48,0.6)", marginRight: 8, ...style,
      }}
    />
  );

  const Item = ({ item }: { item: Report }) => (
    <View style={{
      backgroundColor: "rgba(7,25,48,0.6)",
      borderColor: "#24445C", borderWidth: 1, borderRadius: 12,
      padding: 12, marginBottom: 10,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ color: "white", fontWeight: "700" }}>{item.category} • {item.ward || "No ward"}</Text>
        <Text style={{ color: "#C8D7E1" }}>{item.status.toUpperCase()}</Text>
      </View>
      {item.description ? <Text style={{ color: "#C8D7E1", marginBottom: 6 }}>{item.description}</Text> : null}
      <Text style={{ color: "#8AA5B6", fontSize: 12 }}>
        {item.createdAt?.toDate?.().toLocaleString?.() || ""}
      </Text>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        {item.status === "new" && (
          <Pressable onPress={() => acknowledge(item.id)} style={btnStyle("#2A7390")}><Text style={btnText}>Acknowledge</Text></Pressable>
        )}
        {(item.status === "acknowledged" || item.status === "assigned") && (
          <>
            <Pressable onPress={() => assignTo(item.id, "OFFICER_UID_HERE")} style={btnStyle("#2A7390")}><Text style={btnText}>Assign</Text></Pressable>
            <Pressable onPress={() => resolve(item.id)} style={btnStyle("#0B8F52")}><Text style={btnText}>Resolve</Text></Pressable>
          </>
        )}
      </View>
    </View>
  );

  const btnStyle = (bg: string) => ({
    backgroundColor: bg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
  });
  const btnText = { color: "white", fontWeight: "700" as const };

  return (
    <View style={{ flex: 1, backgroundColor: "#021026", paddingTop: 48, paddingHorizontal: 16 }}>
      {/* Header */}
      <Text style={{ color: "white", fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
        Municipal Dashboard
      </Text>

      {/* Summary tiles */}
      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <Tile label="New" value={counts.new}   active={statusFilter==="new"} onPress={()=>setStatusFilter(statusFilter==="new"?"all":"new")} />
        <Tile label="Ack" value={counts.acknowledged} active={statusFilter==="acknowledged"} onPress={()=>setStatusFilter(statusFilter==="acknowledged"?"all":"acknowledged")} />
        <Tile label="Assigned" value={counts.assigned} active={statusFilter==="assigned"} onPress={()=>setStatusFilter(statusFilter==="assigned"?"all":"assigned")} />
        <Tile label="Resolved" value={counts.resolved} active={statusFilter==="resolved"} onPress={()=>setStatusFilter(statusFilter==="resolved"?"all":"resolved")} />
      </View>

      {/* Filters */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
        <FilterInput placeholder="Ward (e.g., Ward 23)" value={ward} onChangeText={setWard}/>
        <FilterInput placeholder="Category (e.g., Illegal dumping)" value={category} onChangeText={setCategory}/>
        <FilterInput placeholder="From (YYYY-MM-DD)" value={from} onChangeText={setFrom} style={{ minWidth: 150 }}/>
        <FilterInput placeholder="To (YYYY-MM-DD)" value={to} onChangeText={setTo} style={{ minWidth: 150 }}/>
      </View>

      {/* List */}
      <FlatList
        data={reports}
        keyExtractor={(it) => it.id}
        renderItem={Item}
        onEndReachedThreshold={0.25}
        onEndReached={loadMore}
        ListEmptyComponent={
          <Text style={{ color: "#8AA5B6", textAlign: "center", marginTop: 40 }}>
            {loading ? "Loading…" : "No reports match your filters."}
          </Text>
        }
      />
    </View>
  );
}
