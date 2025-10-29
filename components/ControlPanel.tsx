import React from 'react';
import { MapStyle } from '../types';
import { LayersIcon, MapIcon, SatelliteIcon } from './Icons.tsx';

interface ControlPanelProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ currentStyle, onStyleChange }) => {
  const styles: { id: MapStyle; name: string; icon: React.ReactNode }[] = [
    { id: 'street', name: 'Street', icon: <MapIcon className="h-5 w-5" /> },
    { id: 'satellite', name: 'Satellite', icon: <SatelliteIcon className="h-5 w-5" /> },
    { id: 'hybrid', name: 'Hybrid', icon: <LayersIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 p-1.5 bg-white/30 backdrop-blur-md rounded-xl shadow-lg">
      <div className="flex space-x-1">
        {styles.map(style => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900/50 focus:ring-blue-500
              ${currentStyle === style.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/50 text-gray-700 hover:bg-white/80'
              }
            `}
          >
            {style.icon}
            <span className="hidden sm:inline">{style.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;