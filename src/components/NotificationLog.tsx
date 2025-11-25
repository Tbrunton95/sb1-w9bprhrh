import React from 'react';
import { Clock, DollarSign, Target, AlertCircle, MapPin, User, Package, TrendingUp } from 'lucide-react';

export interface StateChange {
  type: 'cash' | 'reputation' | 'heat' | 'time' | 'location' | 'npc' | 'item' | 'level';
  message: string;
  value: number;
  timestamp: number;
}

interface NotificationLogProps {
  changes: StateChange[];
  onClose: () => void;
}

export default function NotificationLog({ changes, onClose }: NotificationLogProps) {
  const getIcon = (type: StateChange['type']) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      case 'reputation':
        return <Target className="w-4 h-4" />;
      case 'heat':
        return <AlertCircle className="w-4 h-4" />;
      case 'time':
        return <Clock className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'npc':
        return <User className="w-4 h-4" />;
      case 'item':
        return <Package className="w-4 h-4" />;
      case 'level':
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getColor = (type: StateChange['type'], value: number) => {
    switch (type) {
      case 'cash':
        return value > 0 ? 'text-green-400' : 'text-red-400';
      case 'reputation':
        return value > 0 ? 'text-blue-400' : 'text-orange-400';
      case 'heat':
        return value > 0 ? 'text-red-400' : 'text-green-400';
      case 'time':
        return 'text-gray-400';
      case 'location':
        return 'text-purple-400';
      case 'npc':
        return 'text-yellow-400';
      case 'item':
        return 'text-cyan-400';
      case 'level':
        return 'text-pink-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const sortedChanges = [...changes].reverse();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-600/50 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-amber-600/30">
          <h2 className="text-xl font-bold text-amber-500">Notification Log</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sortedChanges.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No notifications yet
            </div>
          ) : (
            sortedChanges.map((change, index) => (
              <div
                key={`${change.timestamp}-${index}`}
                className="flex items-start gap-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className={`${getColor(change.type, change.value)} mt-0.5`}>
                  {getIcon(change.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{change.message}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {formatTimestamp(change.timestamp)}
                  </p>
                </div>
                {change.value !== 0 && change.type !== 'location' && change.type !== 'npc' && (
                  <div className={`${getColor(change.type, change.value)} text-sm font-bold whitespace-nowrap`}>
                    {change.value > 0 ? '+' : ''}{change.value}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-amber-600/30">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
