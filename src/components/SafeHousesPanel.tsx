import React, { useState } from 'react';
import { Home, Shield, Package, DollarSign, MapPin, AlertTriangle, Star, Lock, Eye, Pill } from 'lucide-react';
import { SafeHouse } from '../types/game';
import { useGame } from '../context/GameContext';

interface SafeHousesPanelProps {
  safeHouses: SafeHouse[];
}

export default function SafeHousesPanel({ safeHouses }: SafeHousesPanelProps) {
  const { setPrimarySafeHouse, stashAtSafeHouse, state } = useGame();
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  const [showStashModal, setShowStashModal] = useState<string | null>(null);
  const [stashAmount, setStashAmount] = useState('');
  const [stashType, setStashType] = useState<'cash' | 'drugs'>('cash');
  const [selectedDrug, setSelectedDrug] = useState('');

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'penthouse':
        return <Home className="w-5 h-5" />;
      case 'flat':
        return <Home className="w-4 h-4" />;
      case 'warehouse':
        return <Package className="w-5 h-5" />;
      case 'lockup':
        return <Lock className="w-5 h-5" />;
      case 'bedsit':
        return <Home className="w-4 h-4" />;
      case 'house':
        return <Home className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const getOwnershipLabel = (ownership: string) => {
    switch (ownership) {
      case 'owned':
        return { text: 'OWNED', color: 'text-green-400' };
      case 'rented':
        return { text: 'RENTED', color: 'text-blue-400' };
      case 'squatting':
        return { text: 'SQUATTING', color: 'text-red-400' };
      case 'family':
        return { text: 'FAMILY', color: 'text-amber-400' };
      default:
        return { text: ownership.toUpperCase(), color: 'text-gray-400' };
    }
  };

  const getSecurityColor = (level: number) => {
    if (level >= 8) return 'bg-green-500';
    if (level >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSetPrimary = async (houseId: string) => {
    await setPrimarySafeHouse(houseId);
  };

  const handleStash = async (houseId: string) => {
    const amount = parseInt(stashAmount);
    if (amount <= 0) return;

    if (stashType === 'cash') {
      await stashAtSafeHouse(houseId, { cash: amount });
    } else if (stashType === 'drugs' && selectedDrug) {
      await stashAtSafeHouse(houseId, { drugs: { [selectedDrug]: amount } });
    }

    setShowStashModal(null);
    setStashAmount('');
    setSelectedDrug('');
  };

  const getTotalStoredValue = (house: SafeHouse) => {
    let total = house.stored_cash || 0;
    // Could add drug values here if we had pricing
    return total;
  };

  const primaryHouse = safeHouses.find(h => h.is_primary);

  if (safeHouses.length === 0) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3 mb-4">
          <Home className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-mono font-black uppercase tracking-tight text-foreground">Safe Houses</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground font-mono text-sm">
          No safe houses. Acquire properties through gameplay to store cash, drugs, and lay low.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Home className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-mono font-black uppercase tracking-tight text-foreground">Safe Houses</h2>
      </div>

      {/* Primary Safe House Highlight */}
      {primaryHouse && (
        <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-mono font-bold text-primary">PRIMARY RESIDENCE</span>
          </div>
          <div className="text-xl font-mono font-black text-foreground mb-1">{primaryHouse.name}</div>
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{primaryHouse.location}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {safeHouses.map((house) => {
          const ownershipInfo = getOwnershipLabel(house.ownership);
          const isExpanded = selectedHouse === house.id;

          return (
            <div
              key={house.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                house.is_primary
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-card/30 border-border/30 hover:border-primary/20'
              }`}
              onClick={() => setSelectedHouse(isExpanded ? null : house.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${house.is_primary ? 'bg-primary/20' : 'bg-secondary/20'}`}>
                    {getPropertyIcon(house.property_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-mono font-black text-foreground">{house.name}</span>
                      {house.is_primary && <Star className="w-3 h-3 text-amber-500" />}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {house.property_type.charAt(0).toUpperCase() + house.property_type.slice(1)} in {house.location}
                    </div>
                    <div className={`text-xs font-mono font-bold ${ownershipInfo.color}`}>
                      {ownershipInfo.text}
                      {house.monthly_cost > 0 && ` • £${house.monthly_cost}/month`}
                    </div>
                  </div>
                </div>
                {house.discovered_by_police && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-mono text-destructive font-bold">KNOWN</span>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">Security</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">{house.security_level}/10</span>
                  </div>
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getSecurityColor(house.security_level)} transition-all`}
                      style={{ width: `${house.security_level * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">Heat Prot.</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">{house.heat_protection}/10</span>
                  </div>
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-blue-500 transition-all`}
                      style={{ width: `${house.heat_protection * 10}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">Storage</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">{house.storage_capacity}</span>
                  </div>
                </div>
              </div>

              {/* Stored Items Summary */}
              <div className="flex gap-3 mb-3">
                {(house.stored_cash || 0) > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-xs font-mono text-green-400">
                    <DollarSign className="w-3 h-3" />
                    <span>£{house.stored_cash?.toLocaleString()}</span>
                  </div>
                )}
                {house.stored_drugs && Object.keys(house.stored_drugs).length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded text-xs font-mono text-purple-400">
                    <Pill className="w-3 h-3" />
                    <span>{Object.entries(house.stored_drugs).map(([drug, amt]) => `${amt}g ${drug}`).join(', ')}</span>
                  </div>
                )}
                {house.stored_weapons && house.stored_weapons.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-xs font-mono text-red-400">
                    <span>{house.stored_weapons.length} weapon{house.stored_weapons.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  {house.description && (
                    <p className="text-xs font-mono text-muted-foreground mb-3 italic">{house.description}</p>
                  )}

                  {house.features && house.features.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-mono font-bold text-foreground mb-1">Features</div>
                      <div className="flex flex-wrap gap-1">
                        {house.features.map((feature, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-secondary/30 rounded text-xs font-mono text-muted-foreground">
                            {feature.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!house.is_primary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(house.id);
                        }}
                        className="flex-1 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono font-bold rounded transition"
                      >
                        Set as Primary
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStashModal(house.id);
                      }}
                      className="flex-1 px-3 py-2 bg-secondary/50 hover:bg-secondary/70 text-foreground text-xs font-mono font-bold rounded transition"
                    >
                      Stash Items
                    </button>
                  </div>
                </div>
              )}

              {/* Stash Modal */}
              {showStashModal === house.id && (
                <div
                  className="mt-3 p-3 bg-card/50 rounded border border-border/30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xs font-mono font-bold text-foreground mb-2">Stash Items</div>

                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setStashType('cash')}
                      className={`flex-1 px-2 py-1 text-xs font-mono rounded transition ${
                        stashType === 'cash'
                          ? 'bg-primary/20 text-primary font-bold'
                          : 'bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      onClick={() => setStashType('drugs')}
                      className={`flex-1 px-2 py-1 text-xs font-mono rounded transition ${
                        stashType === 'drugs'
                          ? 'bg-primary/20 text-primary font-bold'
                          : 'bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      Drugs
                    </button>
                  </div>

                  {stashType === 'cash' && (
                    <div className="mb-3">
                      <div className="text-xs font-mono text-muted-foreground mb-1">
                        Available: £{state.inventory?.cash?.toLocaleString() || 0}
                      </div>
                      <input
                        type="number"
                        value={stashAmount}
                        onChange={(e) => setStashAmount(e.target.value)}
                        placeholder="Amount to stash"
                        max={state.inventory?.cash || 0}
                        className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground"
                      />
                    </div>
                  )}

                  {stashType === 'drugs' && (
                    <div className="mb-3">
                      <select
                        value={selectedDrug}
                        onChange={(e) => setSelectedDrug(e.target.value)}
                        className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground mb-2"
                      >
                        <option value="">Select drug...</option>
                        {state.inventory?.drugs && Object.entries(state.inventory.drugs).map(([drug, amount]) => (
                          <option key={drug} value={drug}>{drug} ({amount}g available)</option>
                        ))}
                      </select>
                      {selectedDrug && (
                        <input
                          type="number"
                          value={stashAmount}
                          onChange={(e) => setStashAmount(e.target.value)}
                          placeholder="Grams to stash"
                          max={state.inventory?.drugs?.[selectedDrug] || 0}
                          className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStash(house.id)}
                      disabled={(stashType === 'drugs' && !selectedDrug) || !stashAmount}
                      className="flex-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Stash
                    </button>
                    <button
                      onClick={() => {
                        setShowStashModal(null);
                        setStashAmount('');
                        setSelectedDrug('');
                      }}
                      className="px-2 py-1 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-mono rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
