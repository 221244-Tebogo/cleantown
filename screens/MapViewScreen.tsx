import React from "react";
import { StyleSheet } from "react-native";
import { Screen, Card, H2, P } from "../src/ui";
import MapViewWrapper from "../components/MapViewWrapper";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: Region = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapViewScreen({ route }: { route?: { params?: { region?: Region } } }) {
  const region = route?.params?.region ?? DEFAULT_REGION;

  return (
    <Screen>
      <Card>
        <H2>Map</H2>
        <P>Showing current area.</P>
      </Card>

      <MapViewWrapper
        region={region}
        style={styles.map}
        showsUserLocation
        followsUserLocation
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", height: 360 },
});
