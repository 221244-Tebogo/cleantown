import React from "react";
import { StyleSheet } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";

type Props = {
  region: Region;
  showsUserLocation?: boolean;
  height?: number;
};

export default function MapViewWrapper({ region, showsUserLocation = true, height = 0 }: Props) {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={height ? { height, width: "100%" } : StyleSheet.absoluteFill}
      region={region}
      showsUserLocation={showsUserLocation}
    >
      <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
    </MapView>
  );
}
