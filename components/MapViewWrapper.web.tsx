import React, { useMemo } from "react";
import type { Region } from "react-native-maps";

type Props = {
  region: Region;
  showsUserLocation?: boolean;
  height?: number;
};

export default function MapViewWrapper({ region, height = 0 }: Props) {
  const { latitude, longitude } = region;
  const src = useMemo(() => {
    const z = region.latitudeDelta ? Math.round(16 - Math.log2(region.latitudeDelta / 0.01)) : 15;
    const zoom = Math.max(1, Math.min(z, 20));
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed&hl=en`;
  }, [latitude, longitude, region.latitudeDelta]);

  const style = height ? { height, width: "100%" } : { position: "absolute", inset: 0 as number };

  return (
    <div style={{ ...style, overflow: "hidden", borderRadius: 12 }}>
      <iframe
        title="map"
        src={src}
        style={{ border: 0, width: "100%", height: "100%" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
