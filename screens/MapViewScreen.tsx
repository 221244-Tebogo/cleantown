import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import React, { useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import MapView from "react-native-maps";

import MapConfirmBar from "../components/MapConfirmBar";
import MapViewWrapper from "../components/MapViewWrapper";
import { useCurrentRegion } from "../hooks/useCurrentRegion";
import { useNearby } from "../hooks/useNearby";
import { bumpUserPoints } from "../services/points";
import { flagReportStillThere } from "../services/reportPing";

// helpers
function distanceKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R=6371, dLat=((b.lat-a.lat)*Math.PI)/180, dLng=((b.lng-a.lng)*Math.PI)/180;
  const s1=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(s1),Math.sqrt(1-s1));
}
const pretty = (km:number)=> km*1000<1000 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;

export default function MapViewScreen() {
  const nav = useNavigation<any>();
  const { region, ready } = useCurrentRegion(50);
  const mapRef = useRef<MapView>(null);

  // fetch nearby reports
  const reports = useNearby<{ status?: string; category?: string; note?: string }>({
    collectionPath: "reports",
    center: { lat: region.latitude, lng: region.longitude },
    hours: 720, kmRadius: 50, cap: 800,
    toPoint: (d) => {
      const lat = d.location?.lat, lng = d.location?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      return { id: d.id, lat, lng, status: d.status, category: d.category, note: d.note };
    },
  });

  // ALWAYS pick the nearest if any exist
  const active = useMemo(() => {
    if (!reports.length) return null;
    const center = { lat: region.latitude, lng: region.longitude };
    return reports
      .map(r => ({...r, dist: distanceKm(center, {lat:r.lat, lng:r.lng})}))
      .sort((a,b)=>a.dist-b.dist)[0];
  }, [reports, region.latitude, region.longitude]);

  const title = active
    ? (active.category?.toUpperCase?.() || "REPORT") + (active.note ? ` – ${active.note}` : "")
    : "";

  const distanceText = active ? pretty(active.dist) : undefined;

  const onStill = async () => {
    if (!active) return;
    try {
      await flagReportStillThere(active.id, true);
      const uid = getAuth().currentUser?.uid;
      if (uid) await bumpUserPoints(uid, 2);
    } catch (e) {
      console.warn("Still-there ping failed:", e);
    }
  };

  const onGone = async () => {
    if (!active) return;
    try {
      await flagReportStillThere(active.id, false);
    } catch (e) {
      console.warn("Not-there ping failed:", e);
    }
  };

  // Fit camera once reports arrive
  useEffect(() => {
    if (mapRef.current && reports.length > 0) {
      mapRef.current.fitToCoordinates(
        reports.map(r => ({ latitude: r.lat, longitude: r.lng })),
        { edgePadding:{ top:100, bottom:140, left:50, right:50 }, animated:true }
      );
    }
  }, [reports]);

  if (!ready) return <View style={styles.full}><ActivityIndicator/></View>;

  return (
    <View style={styles.full}>
      <MapViewWrapper
        ref={mapRef}
        region={region}
        showsUserLocation
        follow
        accuracyRadius={60}
        nearby={reports.map(r => ({
          id:r.id, location:{lat:r.lat,lng:r.lng}, type:r.category ?? "report", category:r.category ?? "report"
        }))}
        onLongPress={(coord)=> nav.navigate("Report", { coord })}
      />

      {/* Recenter */}
      <Pressable
        onPress={() => mapRef.current?.animateCamera(
          { center:{ latitude:region.latitude, longitude:region.longitude }, zoom:16 },
          { duration:400 }
        )}
        style={[styles.fab,{ right:16, bottom:20 }]}
        accessibilityLabel="Recenter map"
      >
        <Ionicons name="locate" size={20} color="#0B284A" />
      </Pressable>

      {/* Report (upload photo) */}
      <Pressable
        onPress={() => nav.navigate("Report")}
        style={[styles.fab,{ right:16, bottom:76, backgroundColor:"#0EA5E9" }]}
        accessibilityLabel="Report dumping (upload photo)"
      >
        <Ionicons name="camera" size={20} color="#fff" />
      </Pressable>

{/* Always-on confirm bar (Button version) */}
{active && (
  <View pointerEvents="box-none" style={styles.buttonWrap}>
    <View style={styles.buttonBar}>
      <View style={{ flex: 1 }}>
        <Button
          title="Not there"
          onPress={() => handleNotThere(active.id)}
          // color works on iOS/Android (ignored on web)
          color="#6B7280"
        />
      </View>
      <View style={{ width: 10 }} />
      <View style={{ flex: 1 }}>
        <Button
          title="Still there"
          onPress={() => handleStillThere(active.id)}
          color="#0EA5E9"
        />
      </View>
    </View>
  </View>
)}


      {/* Always show confirm bar when any report exists */}
      {active && (
        <MapConfirmBar
          title={title}
          distanceText={distanceText}
          onStillThere={onStill}
          onNotThere={onGone}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  full:{ flex:1, backgroundColor:"#E8F5FF" },
  fab:{ position:"absolute", backgroundColor:"#fff", padding:12, borderRadius:24, elevation:3,
        shadowColor:"#000", shadowOpacity:0.15, shadowRadius:6, shadowOffset:{ width:0, height:2 } },
});