import { MapStyle, MarkerData, ViewState } from "./types";

export const INITIAL_VIEW_STATE: ViewState = {
  latitude: 34.052235,
  longitude: -118.243683,
  zoom: 13,
};

export const INITIAL_MARKERS: MarkerData[] = [
  {
    position: [34.052235, -118.243683],
    title: "Los Angeles City Hall",
    description: "The center of the city of Los Angeles government.",
  },
  {
    position: [34.043, -118.2673],
    title: "Crypto.com Arena",
    description: "Multi-purpose arena in Downtown Los Angeles.",
  },
  {
    position: [34.0624, -118.2384],
    title: "Dodger Stadium",
    description: "Home of the Los Angeles Dodgers.",
  },
  {
    position: [34.0224, -118.2851],
    title: "University of Southern California",
    description: "Private research university in Los Angeles.",
  },
];

export const TILE_LAYERS: Record<
  MapStyle,
  { url: string; attribution: string }
> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  hybrid: {
    url: "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
};
