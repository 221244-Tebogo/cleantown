export interface MarkerData {
  position: [number, number];
  title: string;
  description: string;
}

export type MapStyle = "street" | "satellite" | "hybrid";

export interface ViewState {
  latitude: number;
  longitude: number;
  zoom: number;
}
