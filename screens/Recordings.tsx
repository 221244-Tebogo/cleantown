import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import { listMyRecordings, deleteMyRecording } from "../services/recordingsService";
import { useNavigation } from "@react-navigation/native";

export default function Recordings() {
  const [items, setItems] = useState<any[]>([]);
  const nav = useNavigation<any>();

  async function load() {
    const rows = await listMyRecordings();
    setItems(rows);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, path: string) {
    Alert.alert("Delete recording?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMyRecording(id, path);
            setItems(curr => curr.filter(r => r.id !== id));
          } catch (e: any) {
            Alert.alert("Delete failed", e.message ?? String(e));
          }
        },
      },
    ]);
  }

  const renderItem = ({ item }: any) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title ?? "Voice note"}</Text>
        <Text style={styles.sub} numberOfLines={1}>{item.url}</Text>
      </View>
      <TouchableOpacity style={styles.delete} onPress={() => handleDelete(item.id, item.path)}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.c}>
      <Text style={styles.h}>My Recordings</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  c: {
    flex: 1,
    backgroundColor: "#0B284A",
    padding: 20,
  },
  h: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0E1C2C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#E6EEF7",
    fontWeight: "800",
    fontSize: 16,
  },
  sub: {
    color: "#90A4B8",
    fontSize: 13,
    marginTop: 4,
  },
  delete: {
    marginLeft: 16,
    backgroundColor: "#AF2730",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
});

