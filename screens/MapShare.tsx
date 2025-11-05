import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import type { Region } from "react-native-maps";
import MapViewWrapper from "../components/MapViewWrapper";

import AppBackground from "../components/AppBackground";
import Chat from "./Chat";
import Report from "./Report";

const YELLOW = "#FBBC05";

export default function MapShare() {
  const nav = useNavigation<any>();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: -26.2708,
    longitude: 28.1123,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required to use the map.");
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.root}>
      <AppBackground />
      <MapViewWrapper
        region={region}
        showsUserLocation
        followsUserLocation
        style={StyleSheet.absoluteFillObject as any}
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => setShowReport(true)}>
          <Ionicons name="add-circle-outline" size={32} color={YELLOW} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fab} onPress={() => setShowChat(true)}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={YELLOW} />
        </TouchableOpacity>
      </View>

      <Modal visible={showReport} animationType="slide" onRequestClose={() => setShowReport(false)}>
        <Report />
        <Button title="Close" onPress={() => setShowReport(false)} />
      </Modal>

      <Modal visible={showChat} animationType="slide" onRequestClose={() => setShowChat(false)}>
        <Chat />
        <Button title="Close" onPress={() => setShowChat(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
    gap: 15,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0E1C2C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
