import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Heart, Skull } from 'lucide-react';

interface StateChange {
  id: string;
  type: 'cash' | 'reputation' | 'heat' | 'humanity' | 'compulsion' | 'location' | 'item';
  delta?: number;
  message?: string;
  value?: number;
  timestamp: number;
}

interface StateChangeNotificationProps {
  changes: StateChange[];
}

export default function StateChangeNotification({ changes }: StateChangeNotificationProps) {
  const [visibleChanges, setVisibleChanges] = useState<StateChange[]>([]);

  useEffect(() => {
    if (changes.length > 0) {
      setVisibleChanges(changes);

      const timer = setTimeout(() => {
        setVisibleChanges([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [changes]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      case 'reputation':
        return <TrendingUp className="w-4 h-4" />;
      case 'heat':
        return <AlertCircle className="w-4 h-4" />;
      case 'humanity':
        return <Heart className="w-4 h-4" />;
      case 'compulsion':
        return <Skull className="w-4 h-4" />;
      case 'location':
        return null;
      case 'item':
        return null;
      default:
        return null;
    }
  };

  const getColor = (type: string, delta: number) => {
    if (type === 'cash') return delta > 0 ? 'text-green-400 bg-green-900/30 border-green-700' : 'text-red-400 bg-red-900/30 border-red-700';
    if (type === 'reputation') return delta > 0 ? 'text-blue-400 bg-blue-900/30 border-blue-700' : 'text-orange-400 bg-orange-900/30 border-orange-700';
    if (type === 'heat') return delta > 0 ? 'text-orange-400 bg-orange-900/30 border-orange-700' : 'text-green-400 bg-green-900/30 border-green-700';
    if (type === 'humanity') return delta > 0 ? 'text-pink-400 bg-pink-900/30 border-pink-700' : 'text-red-400 bg-red-900/30 border-red-700';
    if (type === 'compulsion') return delta > 0 ? 'text-red-400 bg-red-900/30 border-red-700' : 'text-green-400 bg-green-900/30 border-green-700';
    if (type === 'location') return 'text-blue-400 bg-blue-900/30 border-blue-700';
    if (type === 'item') return 'text-amber-400 bg-amber-900/30 border-amber-700';
    return 'text-slate-400 bg-slate-900/30 border-slate-700';
  };

  const formatDelta = (change: StateChange) => {
    if (change.message) return change.message;

    const delta = change.delta || 0;
    const sign = delta > 0 ? '+' : '';
    if (change.type === 'cash') return `${sign}£${Math.abs(delta)}`;
    return `${sign}${delta}`;
  };

  const getLabel = (type: string) => {
    if (typeof type !== 'string') return '';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (visibleChanges.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 space-y-2 pointer-events-none">
      {visibleChanges.map((change) => (
        <div
          key={change.id}
          className={`animate-float-up flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg ${getColor(change.type, change.delta || 0)}`}
        >
          {getIcon(change.type)}
          <span className="font-bold text-sm">
            {formatDelta(change)}
          </span>
          <span className="text-xs opacity-75">{getLabel(change.type)}</span>
        </div>
      ))}
    </div>
  );
}

export function useStateChangeNotifications() {
  const [changes, setChanges] = useState<StateChange[]>([]);

  const addChange = (change: { type: StateChange['type']; message: string; value: number }) => {
    const newChange: StateChange = {
      id: `${change.type}-${Date.now()}-${Math.random()}`,
      type: change.type,
      delta: change.value,
      message: change.message,
      value: change.value,
      timestamp: Date.now(),
    };
    setChanges(prev => [...prev, newChange]);
  };

  return { changes, addChange };
}
