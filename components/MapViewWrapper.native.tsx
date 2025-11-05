// components/MapViewWrapper.native.tsx
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { PROVIDER_GOOGLE, type Region } from "react-native-maps";

type Props = {
  region?: Region;
  style?: any;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
};

export default function MapViewWrapper(props: Props) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        style={StyleSheet.absoluteFill}
        // ✅ Android → Google; iOS → default (Apple). No AirGoogleMaps needed.
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={props.showsUserLocation}
        followsUserLocation={props.followsUserLocation}
        initialRegion={
          props.region ?? {
            latitude: -26.2708,
            longitude: 28.1123,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }
        }
      />
    </View>
  );
}
