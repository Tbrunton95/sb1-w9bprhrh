import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';
import * as supabaseService from '../services/supabase';

interface MapPanelProps {
  currentLocationName: string;
  onTravel?: (locationName: string, travelTime: number) => void;
}

export default function MapPanel({ currentLocationName, onTravel }: MapPanelProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const allLocations = await supabaseService.getAllLocations();
        setLocations(allLocations);

        const current = allLocations.find(loc => loc.name === currentLocationName);
        setCurrentLocation(current);
      } catch (error) {
        console.error('Failed to load locations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, [currentLocationName]);

  const calculateDistance = (locationName: string): number => {
    const distances: Record<string, Record<string, number>> = {
      'East End': { 'Camden': 2.5, 'Canary Wharf': 3.0, 'Kings Cross': 1.8, 'Soho': 2.8, 'South Bank': 2.2 },
      'Camden': { 'East End': 2.5, 'Kings Cross': 1.2, 'Soho': 1.5, 'Canary Wharf': 4.5, 'South Bank': 3.0 },
      'Canary Wharf': { 'East End': 3.0, 'South Bank': 2.5, 'Kings Cross': 5.0, 'Soho': 4.8, 'Camden': 4.5 },
      'Kings Cross': { 'Camden': 1.2, 'East End': 1.8, 'Soho': 1.5, 'South Bank': 2.0, 'Canary Wharf': 5.0 },
      'Soho': { 'Kings Cross': 1.5, 'Camden': 1.5, 'East End': 2.8, 'South Bank': 1.2, 'Canary Wharf': 4.8 },
      'South Bank': { 'Soho': 1.2, 'Kings Cross': 2.0, 'East End': 2.2, 'Canary Wharf': 2.5, 'Camden': 3.0 },
    };
    return distances[currentLocationName]?.[locationName] || 2.0;
  };

  const nearbyWithDistance = locations
    .filter(loc => loc.name !== currentLocationName)
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      distance: calculateDistance(loc.name),
      travelTime: Math.ceil(calculateDistance(loc.name) * 3),
      heatLevel: loc.danger_level || 5,
      description: loc.description,
    }));

  const getHeatColor = (heat: number) => {
    if (heat >= 7) return 'text-red-400 bg-red-900/30 border-red-700';
    if (heat >= 4) return 'text-orange-400 bg-orange-900/30 border-orange-700';
    if (heat >= 2) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
    return 'text-green-400 bg-green-900/30 border-green-700';
  };

  const handleTravelClick = (locationName: string) => {
    setSelectedLocation(locationName);
  };

  const confirmTravel = (locationName: string, travelTime: number) => {
    onTravel?.(locationName, travelTime);
    setSelectedLocation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Location */}
      <div className="bg-slate-800 rounded-lg p-4 border-2 border-amber-600">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-amber-500 animate-pulse" />
          <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wide">Current Location</h3>
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-lg font-bold text-white mb-1">
              {currentLocation?.name || currentLocationName}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Danger Level</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${getHeatColor(currentLocation?.danger_level || 0)}`}>
                {currentLocation?.danger_level || 0}/10
              </span>
            </div>
          </div>

          {currentLocation?.description && (
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-700 italic">
              {currentLocation.description}
            </p>
          )}
        </div>
      </div>

      {/* Nearby Locations */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-400" />
          Nearby Locations
        </h3>

        <div className="space-y-2">
          {nearbyWithDistance.map((location) => (
            <div key={location.id}>
              <div
                className={`bg-slate-900 rounded-lg p-3 border transition-all cursor-pointer ${
                  selectedLocation === location.name
                    ? 'border-amber-600 bg-slate-800'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => handleTravelClick(location.name)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm mb-1">
                      {location.name}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getHeatColor(location.heatLevel)}`}>
                    Heat: {location.heatLevel}/10
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Navigation className="w-3 h-3" />
                    <span>{location.distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{location.travelTime} min</span>
                  </div>
                </div>

                {selectedLocation === location.name && (
                  <div className="pt-3 border-t border-slate-700 space-y-2">
                    {location.description && (
                      <div>
                        <div className="text-xs text-slate-400 italic">
                          {location.description}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmTravel(location.name, location.travelTime);
                      }}
                      className="w-full px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-semibold transition-colors"
                    >
                      Travel to {location.name}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Visualization */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide">London Map</h3>
        <div className="relative bg-slate-950 rounded-lg p-6 aspect-video flex items-center justify-center">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 300">
              {/* Thames River */}
              <path
                d="M 50 180 Q 200 200, 350 170"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="4"
                fill="none"
              />

              {/* Location dots */}
              <circle cx="120" cy="160" r="8" fill="rgb(251, 191, 36)" className="animate-pulse" />
              <circle cx="180" cy="140" r="6" fill="rgb(148, 163, 184)" />
              <circle cx="100" cy="170" r="6" fill="rgb(148, 163, 184)" />
              <circle cx="250" cy="150" r="6" fill="rgb(148, 163, 184)" />
              <circle cx="300" cy="130" r="6" fill="rgb(148, 163, 184)" />
            </svg>
          </div>

          <div className="relative z-10 text-center">
            <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
            <div className="text-xs text-slate-400">
              {currentLocation?.name || currentLocationName}
            </div>
          </div>
        </div>
      </div>

      {/* Travel Info */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="mb-1">Traveling advances time and may attract attention.</p>
            <p>Higher danger locations are riskier but offer better opportunities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
