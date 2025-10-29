import type { Map } from 'leaflet';
import React, { useEffect, useRef } from 'react';
import { TILE_LAYERS } from '../constants.ts';
import { MapStyle, MarkerData, ViewState } from '../types.ts';

// Since we are not using a bundler for assets, we have to manually set the icon paths.
// This is a common requirement when using Leaflet with frameworks like React without special plugins.
if (typeof window !== 'undefined' && (window as any).L) {
  const L = (window as any).L;
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapComponentProps {
  viewState: ViewState;
  markers: MarkerData[];
  mapStyle: MapStyle;
}

const MapComponent: React.FC<MapComponentProps> = ({ viewState, markers, mapStyle }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current && (window as any).L) {
      const L = (window as any).L;
      mapRef.current = L.map(mapContainerRef.current).setView(
        [viewState.latitude, viewState.longitude],
        viewState.zoom
      );

      // Add initial tile layer
      const initialLayer = TILE_LAYERS[mapStyle];
      tileLayerRef.current = L.tileLayer(initialLayer.url, {
        attribution: initialLayer.attribution,
      }).addTo(mapRef.current);
    }
    
    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer when map style changes
  useEffect(() => {
    if (mapRef.current && (window as any).L) {
      const L = (window as any).L;
      const newLayer = TILE_LAYERS[mapStyle];
      
      const newTileLayer = L.tileLayer(newLayer.url, {
        attribution: newLayer.attribution,
      });

      // Add the new layer before removing the old one for a smoother transition
      newTileLayer.addTo(mapRef.current);

      if (tileLayerRef.current) {
        // Fade out old layer if browser supports it
        const oldLayerEl = tileLayerRef.current.getContainer();
        if (oldLayerEl) {
            oldLayerEl.style.transition = 'opacity 0.5s';
            oldLayerEl.style.opacity = 0;
        }
        setTimeout(() => {
            if (mapRef.current && tileLayerRef.current) {
                mapRef.current.removeLayer(tileLayerRef.current);
            }
        }, 500);
      }
      
      tileLayerRef.current = newTileLayer;
    }
  }, [mapStyle]);

  // Update markers
  useEffect(() => {
    if (mapRef.current && (window as any).L) {
      const L = (window as any).L;
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      markers.forEach(markerInfo => {
        const marker = L.marker(markerInfo.position).addTo(mapRef.current!);
        const popupContent = `
          <div class="p-1">
            <h3 class="font-bold text-lg text-gray-800">${markerInfo.title}</h3>
            <p class="text-gray-600">${markerInfo.description}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      });
    }
  }, [markers]);

  return <div ref={mapContainerRef} className="h-full w-full z-0" />;
};

export default MapComponent;