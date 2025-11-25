import React, { useState } from 'react';
import { Car, Bike, Zap, Wrench, Fuel, MapPin, AlertTriangle, Check, X } from 'lucide-react';
import { Vehicle } from '../types/game';
import { useGame } from '../context/GameContext';

interface VehiclesPanelProps {
  vehicles: Vehicle[];
}

export default function VehiclesPanel({ vehicles }: VehiclesPanelProps) {
  const { setActiveVehicle, updateVehicle, refuelVehicle, repairVehicle } = useGame();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [showRefuel, setShowRefuel] = useState<string | null>(null);
  const [showRepair, setShowRepair] = useState<string | null>(null);
  const [refuelAmount, setRefuelAmount] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [showParkModal, setShowParkModal] = useState<string | null>(null);
  const [parkLocation, setParkLocation] = useState('');

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'car':
        return <Car className="w-5 h-5" />;
      case 'motorcycle':
      case 'moped':
        return <Bike className="w-5 h-5" />;
      case 'e-bike':
      case 'bicycle':
        return <Zap className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  const getFuelColor = (level: number) => {
    if (level >= 60) return 'bg-green-500';
    if (level >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConditionColor = (level: number) => {
    if (level >= 70) return 'bg-green-500';
    if (level >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSetActive = async (vehicleId: string) => {
    await setActiveVehicle(vehicleId);
  };

  const handleRefuel = async (vehicleId: string) => {
    const amount = parseInt(refuelAmount);
    if (amount > 0 && amount <= 100) {
      await refuelVehicle(vehicleId, amount);
      setShowRefuel(null);
      setRefuelAmount('');
    }
  };

  const handleRepair = async (vehicleId: string) => {
    const cost = parseInt(repairCost);
    if (cost > 0) {
      await repairVehicle(vehicleId, cost);
      setShowRepair(null);
      setRepairCost('');
    }
  };

  const handlePark = async (vehicleId: string) => {
    if (parkLocation.trim()) {
      await updateVehicle(vehicleId, { parked_location: parkLocation.trim() });
      setShowParkModal(null);
      setParkLocation('');
    }
  };

  const activeVehicle = vehicles.find(v => v.is_active);

  if (vehicles.length === 0) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3 mb-4">
          <Car className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-mono font-black uppercase tracking-tight text-foreground">Vehicles</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground font-mono text-sm">
          No vehicles. Acquire vehicles through gameplay to expand your transport options.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Car className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-mono font-black uppercase tracking-tight text-foreground">Vehicles</h2>
      </div>

      {activeVehicle && (
        <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            {getVehicleIcon(activeVehicle.vehicle_type)}
            <span className="text-sm font-mono font-bold text-primary">ACTIVE VEHICLE</span>
          </div>
          <div className="text-xl font-mono font-black text-foreground mb-1">{activeVehicle.make_model}</div>
          <div className="text-xs font-mono text-muted-foreground">{activeVehicle.color} {activeVehicle.vehicle_type}</div>
          {activeVehicle.parked_location && (
            <div className="flex items-center gap-1 mt-2 text-xs font-mono text-foreground">
              <MapPin className="w-3 h-3" />
              <span>Parked: {activeVehicle.parked_location}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className={`p-4 rounded-lg border transition-all ${
              vehicle.is_active
                ? 'bg-primary/5 border-primary/30'
                : 'bg-card/30 border-border/30 hover:border-primary/20'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded ${vehicle.is_active ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                  {getVehicleIcon(vehicle.vehicle_type)}
                </div>
                <div>
                  <div className="text-base font-mono font-black text-foreground">{vehicle.make_model}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {vehicle.color} {vehicle.vehicle_type}
                    {vehicle.registration && ` • ${vehicle.registration}`}
                  </div>
                  {vehicle.is_stolen && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-destructive" />
                      <span className="text-xs font-mono text-destructive font-bold">STOLEN/HOT</span>
                    </div>
                  )}
                </div>
              </div>
              {!vehicle.is_active && (
                <button
                  onClick={() => handleSetActive(vehicle.id)}
                  className="px-3 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition"
                >
                  USE
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">Fuel</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground">{vehicle.fuel_level}%</span>
                </div>
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getFuelColor(vehicle.fuel_level)} transition-all`}
                    style={{ width: `${vehicle.fuel_level}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">Condition</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-foreground">{vehicle.condition}%</span>
                </div>
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getConditionColor(vehicle.condition)} transition-all`}
                    style={{ width: `${vehicle.condition}%` }}
                  />
                </div>
              </div>
            </div>

            {vehicle.parked_location && (
              <div className="flex items-center gap-1 mb-3 text-xs font-mono text-foreground bg-secondary/20 px-2 py-1 rounded">
                <MapPin className="w-3 h-3" />
                <span>Parked: {vehicle.parked_location}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowRefuel(vehicle.id)}
                className="flex-1 px-2 py-1.5 bg-secondary/50 hover:bg-secondary/70 text-foreground text-xs font-mono font-bold rounded transition"
              >
                Refuel
              </button>
              <button
                onClick={() => setShowRepair(vehicle.id)}
                className="flex-1 px-2 py-1.5 bg-secondary/50 hover:bg-secondary/70 text-foreground text-xs font-mono font-bold rounded transition"
              >
                Repair
              </button>
              <button
                onClick={() => setShowParkModal(vehicle.id)}
                className="flex-1 px-2 py-1.5 bg-secondary/50 hover:bg-secondary/70 text-foreground text-xs font-mono font-bold rounded transition"
              >
                Park
              </button>
            </div>

            {showRefuel === vehicle.id && (
              <div className="mt-3 p-3 bg-card/50 rounded border border-border/30">
                <div className="text-xs font-mono font-bold text-foreground mb-2">Refuel Vehicle</div>
                <input
                  type="number"
                  value={refuelAmount}
                  onChange={(e) => setRefuelAmount(e.target.value)}
                  placeholder="Amount (0-100)"
                  max={100 - vehicle.fuel_level}
                  className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground mb-2"
                />
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  Cost: £{Math.ceil(parseInt(refuelAmount || '0') * 1.5)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefuel(vehicle.id)}
                    className="flex-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono rounded transition"
                  >
                    <Check className="w-3 h-3 inline" /> Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowRefuel(null);
                      setRefuelAmount('');
                    }}
                    className="px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono rounded transition"
                  >
                    <X className="w-3 h-3 inline" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {showRepair === vehicle.id && (
              <div className="mt-3 p-3 bg-card/50 rounded border border-border/30">
                <div className="text-xs font-mono font-bold text-foreground mb-2">Repair Vehicle</div>
                <input
                  type="number"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                  placeholder="Repair cost (£)"
                  className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground mb-2"
                />
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  Estimated repair: +{Math.min(100 - vehicle.condition, Math.floor(parseInt(repairCost || '0') / 10))}%
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRepair(vehicle.id)}
                    className="flex-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono rounded transition"
                  >
                    <Check className="w-3 h-3 inline" /> Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowRepair(null);
                      setRepairCost('');
                    }}
                    className="px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono rounded transition"
                  >
                    <X className="w-3 h-3 inline" /> Cancel
                  </button>
                </div>
              </div>
            )}

            {showParkModal === vehicle.id && (
              <div className="mt-3 p-3 bg-card/50 rounded border border-border/30">
                <div className="text-xs font-mono font-bold text-foreground mb-2">Park Vehicle</div>
                <input
                  type="text"
                  value={parkLocation}
                  onChange={(e) => setParkLocation(e.target.value)}
                  placeholder="Location (e.g., Underground Car Park)"
                  className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePark(vehicle.id)}
                    className="flex-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono rounded transition"
                  >
                    <Check className="w-3 h-3 inline" /> Park
                  </button>
                  <button
                    onClick={() => {
                      setShowParkModal(null);
                      setParkLocation('');
                    }}
                    className="px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono rounded transition"
                  >
                    <X className="w-3 h-3 inline" /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
