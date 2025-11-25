import React, { useState } from 'react';
import { Package, Zap, Pill, Shield, Smartphone, Lock, X } from 'lucide-react';
import { PlayerInventory, ItemState } from '../types/game';

interface InventoryPanelProps {
  inventory: PlayerInventory;
  itemStates: ItemState[];
  onItemAction?: (item: ItemState, action: string) => void;
  onDrugUse?: (drugId: string, drugName: string, amount: number) => void;
}

export default function InventoryPanel({ inventory, itemStates, onItemAction, onDrugUse }: InventoryPanelProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [inspectItem, setInspectItem] = useState<ItemState | null>(null);

  const weapons = itemStates.filter(item => item.item_type === 'weapon' && item.equipped);
  const equipment = itemStates.filter(item => item.item_type === 'equipment' && item.equipped);
  const storedWeapons = itemStates.filter(item => item.item_type === 'weapon' && !item.equipped);
  const storedEquipment = itemStates.filter(item => item.item_type === 'equipment' && !item.equipped);
  const drugs = [
    { id: 'cocaine', name: 'Cocaine', amount: inventory.drugs?.Cocaine || 0, unit: 'g' },
    { id: 'mdma', name: 'MDMA', amount: inventory.drugs?.MDMA || 0, unit: 'g' },
    { id: 'cannabis', name: 'Cannabis', amount: inventory.drugs?.Cannabis || 0, unit: 'g' },
  ];

  const handleItemClick = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const getItemIcon = (item: ItemState) => {
    switch (item.item_type) {
      case 'weapon':
        return Zap;
      case 'equipment':
        if (item.item_id === 'burner_phone') return Smartphone;
        if (item.item_id === 'kevlar_vest') return Shield;
        if (item.item_id === 'lockpick_set') return Lock;
        return Package;
      default:
        return Package;
    }
  };

  const InspectModal = ({ item }: { item: ItemState }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{item.item_name}</h3>
          <button
            onClick={() => setInspectItem(null)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Type</div>
            <div className="text-sm text-slate-300 capitalize">{item.item_type}</div>
          </div>

          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Status</div>
            <div className="flex items-center gap-2">
              {item.equipped ? (
                <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-700">
                  {item.item_type === 'weapon' ? 'Drawn' : 'Equipped'}
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded border border-slate-700">
                  {item.item_type === 'weapon' ? 'Holstered' : 'Not Equipped'}
                </span>
              )}
            </div>
          </div>

          {item.quantity > 1 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Quantity</div>
              <div className="text-sm text-slate-300">{item.quantity}</div>
            </div>
          )}

          {Object.keys(item.metadata).length > 0 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Details</div>
              <div className="space-y-2 bg-slate-950 rounded p-3">
                {Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-slate-200">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-700">
            <button
              onClick={() => {
                setInspectItem(null);
                onItemAction?.(item, item.equipped ? 'holster' : 'draw');
              }}
              className="w-full px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-medium transition-colors"
            >
              {item.equipped ? (item.item_type === 'weapon' ? 'Holster' : 'Unequip') : (item.item_type === 'weapon' ? 'Draw' : 'Equip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Weapons Section */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-400" />
          Weapons
        </h3>
        <div className="space-y-2">
          {weapons.length > 0 ? (
            weapons.map((weapon) => {
              const Icon = getItemIcon(weapon);
              return (
                <div key={weapon.id} className="relative">
                  <div
                    className="flex items-center justify-between p-3 bg-slate-900 rounded hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => handleItemClick(weapon.item_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{weapon.item_name}</div>
                        {weapon.metadata.ammo !== undefined && (
                          <div className="text-xs text-slate-500">{weapon.metadata.ammo} rounds</div>
                        )}
                      </div>
                    </div>
                    {weapon.equipped && (
                      <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-700">
                        Drawn
                      </span>
                    )}
                  </div>
                  {expandedItem === weapon.item_id && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemAction?.(weapon, weapon.equipped ? 'holster' : 'draw');
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
                      >
                        {weapon.equipped ? 'Holster' : 'Draw'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem(weapon);
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-slate-500 text-sm">No weapons</p>
          )}
        </div>
      </div>

      {/* Drugs Section */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
          <Pill className="w-4 h-4 text-purple-400" />
          Drugs
        </h3>
        <div className="space-y-2">
          {drugs.map((drug) => (
            <div key={drug.id} className="relative">
              <div
                className={`flex items-center justify-between p-3 bg-slate-900 rounded transition-colors ${drug.amount > 0 ? 'hover:bg-slate-700 cursor-pointer' : 'opacity-50'}`}
                onClick={() => drug.amount > 0 && handleItemClick(drug.id)}
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{drug.name}</div>
                    <div className="text-xs text-slate-500">
                      {drug.amount} {drug.unit}
                    </div>
                  </div>
                </div>
                {drug.amount === 0 && (
                  <span className="text-xs text-slate-600">Empty</span>
                )}
              </div>
              {expandedItem === drug.id && drug.amount > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      onDrugUse?.(drug.id, drug.name, drug.amount);
                      setExpandedItem(null);
                    }}
                    className="w-full px-3 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded transition-colors"
                  >
                    Use
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Section */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-400" />
          Equipment
        </h3>
        <div className="space-y-2">
          {equipment.length > 0 ? (
            equipment.map((item) => {
              const Icon = getItemIcon(item);
              return (
                <div key={item.id} className="relative">
                  <div
                    className="flex items-center justify-between p-3 bg-slate-900 rounded hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => handleItemClick(item.item_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{item.item_name}</div>
                      </div>
                    </div>
                    {item.equipped && (
                      <span className="text-xs text-green-400">✓</span>
                    )}
                  </div>
                  {expandedItem === item.item_id && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemAction?.(item, item.equipped ? 'unequip' : 'equip');
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
                      >
                        {item.equipped ? 'Unequip' : 'Equip'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem(item);
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-slate-500 text-sm">No equipment</p>
          )}
        </div>
      </div>

      {/* Storage Section */}
      {(storedWeapons.length > 0 || storedEquipment.length > 0) && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            Storage
          </h3>
          <div className="space-y-2">
            {storedWeapons.map((weapon) => {
              const Icon = getItemIcon(weapon);
              return (
                <div key={weapon.id} className="relative">
                  <div
                    className="flex items-center justify-between p-3 bg-slate-900 rounded hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => handleItemClick(weapon.item_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{weapon.item_name}</div>
                        <div className="text-xs text-slate-500">Holstered</div>
                      </div>
                    </div>
                  </div>
                  {expandedItem === weapon.item_id && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemAction?.(weapon, 'draw');
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
                      >
                        Draw
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem(weapon);
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {storedEquipment.map((item) => {
              const Icon = getItemIcon(item);
              return (
                <div key={item.id} className="relative">
                  <div
                    className="flex items-center justify-between p-3 bg-slate-900 rounded hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => handleItemClick(item.item_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-white">{item.item_name}</div>
                        <div className="text-xs text-slate-500">Stored</div>
                      </div>
                    </div>
                  </div>
                  {expandedItem === item.item_id && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemAction?.(item, 'equip');
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white rounded transition-colors"
                      >
                        Equip
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem(item);
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Total Weight/Capacity */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Carrying Capacity</span>
          <span className="text-slate-300 font-medium">
            {itemStates.length} / 20 items
          </span>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectItem && <InspectModal item={inspectItem} />}
    </div>
  );
}
