import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Button, Alert, FlatList, TouchableOpacity, Platform } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { deleteMyRecording } from "../services/recordingsService";

import { onAuthStateChanged } from "firebase/auth";

type SavedRecording = {
  id: string;        
  localUri: string;    
  duration: string;    
  createdAt: number;   
  remoteUrl?: string;  
  path?: string;       
};

const STORAGE_KEY = (uid: string) => `@local_recordings_v1_${uid}`;                
const RECORDINGS_DIR = (uid: string) => FileSystem.documentDirectory + `recordings/${uid}/`; 

export default function Listen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [items, setItems] = useState<SavedRecording[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null));
    return unsub;
  }, []);

  // helpers
  const ensureDirAsync = useCallback(async () => {
    if (!uid) return;
    const dir = RECORDINGS_DIR(uid);
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }, [uid]);

  const loadLocal = useCallback(async () => {
    if (!uid) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY(uid));
      setItems(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.warn("Failed to load local recordings:", e);
      setItems([]);
    }
  }, [uid]);

  const saveLocal = useCallback(
    async (list: SavedRecording[]) => {
      setItems(list);
      if (!uid) return;
      try {
        await AsyncStorage.setItem(STORAGE_KEY(uid), JSON.stringify(list));
      } catch (e) {
        console.warn("Failed to persist local recordings:", e);
      }
    },
    [uid]
  );

  const mergeFromFirestore = useCallback(async () => {
    if (!uid) return;
    try {
      const qRef = query(
        collection(db, "users", uid, "recordings"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(qRef);

      const serverRecs: SavedRecording[] = [];
      snap.forEach((docu) => {
        const d = docu.data() as any;
        if (!d?.url || typeof d.url !== "string") return;

        const created = d.createdAt?.toMillis?.() ?? Date.now();
        const durMs = typeof d.durationMs === "number" ? d.durationMs : 0;

        serverRecs.push({
          id: docu.id,
          localUri: d.url,        
          duration: formatFromMs(durMs),
          createdAt: created,
          remoteUrl: d.url,
          path: d.path,                   
        });
      });

      const merged = [...items];
      for (const s of serverRecs) {
        const dup = merged.find(
          (r) =>
            (r.remoteUrl && s.remoteUrl && r.remoteUrl === s.remoteUrl) ||
            Math.abs(r.createdAt - s.createdAt) < 3000
        );
        if (!dup) merged.push(s);
      }
      if (merged.length !== items.length) {
        await saveLocal(merged);
      }
    } catch (e) {
      console.warn("Failed to merge Firestore recordings:", e);
    }
  }, [db, items, saveLocal, uid]);

  useEffect(() => {
    (async () => {
      if (!uid) return;
      await ensureDirAsync();
      await loadLocal();
      await mergeFromFirestore();
    })();
  }, [uid, ensureDirAsync, loadLocal, mergeFromFirestore]);

  // record
  async function startRecording() {
    if (!uid) {
      Alert.alert("Not signed in", "Please sign in to record.");
      return;
    }
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission required", "Microphone access is needed to record audio.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording:", err);
      Alert.alert("Error", "Could not start recording.");
    }
  }

  async function stopRecording() {
    if (!uid || !recording) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const status = await recording.getStatusAsync();
      const millis = (status as any).durationMillis ?? 0;
      const duration = formatFromMs(millis);

      const tempUri = recording.getURI();
      if (!tempUri) throw new Error("Recording URI is undefined");

  
      await ensureDirAsync();
      const fileName = `rec-${Date.now()}.m4a`;
      const finalPath = RECORDINGS_DIR(uid) + fileName;
      await FileSystem.moveAsync({ from: tempUri, to: finalPath });

      // save locally
      const local: SavedRecording = {
        id: `local-${Date.now()}`,
        localUri: finalPath,
        duration,
        createdAt: Date.now(),
      };
      const next = [...items, local];
      await saveLocal(next);

      // upload → Storage: voice/{uid}/{fileName}, then write Firestore doc in users/{uid}/recordings
      (async () => {
        try {
          const bytes = await uriToBytes(finalPath);
          const storagePath = `voice/${uid}/${fileName}`; // <-- matches Storage rules
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, bytes);
          const url = await getDownloadURL(storageRef);

          await addDoc(collection(db, "users", uid, "recordings"), {
            url,
            path: storagePath,                // save path for delete later
            durationMs: millis,
            createdAt: serverTimestamp(),
          });

          // patch local with remoteUrl so UI can play from cloud if needed
          const raw = (await AsyncStorage.getItem(STORAGE_KEY(uid))) || "[]";
          const list: SavedRecording[] = JSON.parse(raw);
          const idx = list.findIndex((r) => r.id === local.id);
          if (idx >= 0) {
            list[idx] = { ...list[idx], remoteUrl: url, path: storagePath };
            await AsyncStorage.setItem(STORAGE_KEY(uid), JSON.stringify(list));
            setItems(list);
          }
        } catch (e) {
          console.warn("Upload/Firestore sync failed (local kept):", e);
        }
      })();
    } catch (err) {
      console.error("Failed to stop/save recording:", err);
      Alert.alert("Error", "Could not save the recording.");
    } finally {
      setRecording(null);
    }
  }

  // playback
  async function play(rec: SavedRecording) {
    try {
      const playableUri = await ensurePlayableUri(rec);
      if (!playableUri) {
        Alert.alert("Missing file", "This recording is not available offline yet.");
        return;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: playableUri });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.error("Playback error:", e);
    }
  }

  async function ensurePlayableUri(rec: SavedRecording): Promise<string | null> {
    if (rec.localUri && rec.localUri.startsWith("file")) {
      const info = await FileSystem.getInfoAsync(rec.localUri);
      if (info.exists) return rec.localUri;
    }
    if (rec.remoteUrl) return rec.remoteUrl;
    return null;
  }

  // utils
  function formatFromMs(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  async function uriToBytes(uri: string): Promise<Uint8Array> {
    // Works on web (blob:) and native (file:) URIs
    if (Platform.OS === "web") {
      const res = await fetch(uri);
      const blob = await res.blob();
      const arrayBuf = await blob.arrayBuffer();
      return new Uint8Array(arrayBuf);
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const binaryString = global.atob ? global.atob(base64) : Buffer.from(base64, "base64").toString("binary");
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    }
  }

  async function clearLocal() {
    if (!uid) return;
    try {
      for (const r of items) {
        if (r.localUri?.startsWith("file")) {
          const info = await FileSystem.getInfoAsync(r.localUri);
          if (info.exists) await FileSystem.deleteAsync(r.localUri, { idempotent: true });
        }
      }
      await AsyncStorage.removeItem(STORAGE_KEY(uid));
      setItems([]);
    } catch (e) {
      console.warn("Failed to clear local recordings:", e);
    }
  }

  const renderItem = ({ item, index }: { item: SavedRecording; index: number }) => (
  <View style={styles.row}>
    <Text style={styles.fill}>Recording #{index + 1} | {item.duration}</Text>

    <TouchableOpacity style={styles.btn} onPress={() => play(item)}>
      <Text style={styles.btnText}>Play</Text>
    </TouchableOpacity>

    <View style={{ width: 8 }} />

    <TouchableOpacity style={[styles.btn, { backgroundColor: "#AF2730" }]} onPress={() => handleDelete(item)}>
      <Text style={styles.btnText}>Delete</Text>
    </TouchableOpacity>
  </View>
);

  async function handleDelete(rec: SavedRecording) {
  Alert.alert("Delete recording?", "This action cannot be undone.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          // remote (has Firestore doc id + Storage path)
          if (rec.id && !rec.id.startsWith("local-") && rec.path) {
            await deleteMyRecording(rec.id, rec.path);
          }

          // local file cleanup (if present)
          if (rec.localUri?.startsWith("file")) {
            const info = await FileSystem.getInfoAsync(rec.localUri);
            if (info.exists) await FileSystem.deleteAsync(rec.localUri, { idempotent: true });
          }

          // remove from local state + AsyncStorage
          const next = items.filter((r) => r.id !== rec.id);
          await saveLocal(next);
        } catch (e: any) {
          Alert.alert("Delete failed", e?.message ?? String(e));
        }
      },
    },
  ]);
}


  return (
    <View style={styles.container}>
      <Button
        title={recording ? "Stop Recording" : "Start Recording"}
        onPress={recording ? stopRecording : startRecording}
      />

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12 }}
      />

      {items.length > 0 && <Button title="Clear Local Recordings" onPress={clearLocal} />}
      <View style={{ height: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B284A",
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  fill: {
    flex: 1,
    marginRight: 10,
    color: "#E6EEF7",
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#0E1C2C",
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});

