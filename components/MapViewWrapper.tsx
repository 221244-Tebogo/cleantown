import React, { forwardRef, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Camera, Circle, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

type Nearby = {
  id: string;
  location: { lat: number; lng: number };
  category?: string;
  type?: string;
};

type Props = {
  region: Region;
  showsUserLocation?: boolean;
  height?: number;
  follow?: boolean;
  showMarker?: boolean;
  accuracyRadius?: number;
  nearby?: Nearby[];
  onLongPress?: (coord: { latitude: number; longitude: number }) => void;
};

function deltaToZoom(latitudeDelta: number) {
  const zoom = Math.round(16 - Math.log2(Math.max(latitudeDelta, 0.0005) / 0.01));
  return Math.max(1, Math.min(20, zoom));
}

function pinColorFor(cat?: string) {
  switch ((cat || "").toLowerCase()) {
    case "cleanup":
      return "#22c55e";
    case "police":
      return "#3b82f6";
    case "hazard":
      return "#f59e0b";
    default:
      return "#ef4444";
  }
}

const MapViewWrapper = forwardRef<MapView, Props>(function MapViewWrapper(
  { region, showsUserLocation = true, height = 0, follow = true, showMarker = false, accuracyRadius, nearby = [], onLongPress },
  ref
) {
  const innerRef = useRef<MapView | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as MapView);
  const style = height ? { height, width: "100%" } : StyleSheet.absoluteFillObject;

  const camera: Camera = useMemo(() => {
    const zoom = deltaToZoom(region.latitudeDelta ?? 0.01);
    return { center: { latitude: region.latitude, longitude: region.longitude }, zoom, heading: 0, pitch: 0, altitude: 0 };
  }, [region]);

  useEffect(() => {
    innerRef.current?.animateCamera(camera, { duration: 600 });
  }, [camera]);

  return (
    <View style={style}>
      <MapView
        ref={innerRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialCamera={camera}
        showsUserLocation={showsUserLocation}
        followsUserLocation={follow}
        showsMyLocationButton
        toolbarEnabled
        rotateEnabled={false}
        onLongPress={(e) => onLongPress?.(e.nativeEvent.coordinate)}
      >
        {showMarker && (
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
        )}
        {!!accuracyRadius && (
          <Circle
            center={{ latitude: region.latitude, longitude: region.longitude }}
            radius={accuracyRadius}
            strokeColor="rgba(14,165,233,0.5)"
            fillColor="rgba(14,165,233,0.15)"
          />
        )}
        {nearby.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.location.lat, longitude: r.location.lng }}
            pinColor={pinColorFor(r.category || r.type)}
          />
        ))}
      </MapView>
    </View>
  );
});

export default MapViewWrapper;
