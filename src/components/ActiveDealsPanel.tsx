import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, DollarSign, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { ActiveDeal } from '../types/game';

interface ActiveDealsPanelProps {
  deals: ActiveDeal[];
  currentDay: number;
  currentHour: number;
  onDealClick?: (dealId: string) => void;
}

export default function ActiveDealsPanel({ deals, currentDay, currentHour, onDealClick }: ActiveDealsPanelProps) {
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);
  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRiskColor = (risk: number) => {
    if (risk >= 7) return { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700', label: 'High' };
    if (risk >= 4) return { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-700', label: 'Medium' };
    return { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-700', label: 'Low' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-900/30 text-blue-400 border-blue-700';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-700';
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-700';
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-700';
      default:
        return 'bg-slate-700 text-slate-400 border-slate-600';
    }
  };

  const calculateTimeRemaining = (dueDay: number) => {
    const hoursRemaining = (dueDay * 24 - currentDay * 24 - currentHour);
    const days = Math.floor(hoursRemaining / 24);
    const hours = hoursRemaining % 24;

    if (hoursRemaining < 0) return 'Overdue';
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getProgress = (deal: ActiveDeal) => {
    const totalTime = (deal.due_day - deal.start_day) * 24;
    const elapsed = (currentDay - deal.start_day) * 24 + currentHour;
    return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  };

  const getDealTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return '🛒';
      case 'sell':
        return '💰';
      case 'transport':
        return '🚚';
      case 'protect':
        return '🛡️';
      default:
        return '📦';
    }
  };

  if (deals.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">No active deals</p>
        <p className="text-slate-600 text-xs mt-2">Make connections to start doing business</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deals.map((deal) => {
        const riskColors = getRiskColor(deal.risk_level);
        const isExpanded = expandedDeal === deal.id;
        const progress = getProgress(deal);
        const timeRemaining = calculateTimeRemaining(deal.due_day);

        return (
          <div
            key={deal.id}
            className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-all"
          >
            {/* Deal Header */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => {
                setExpandedDeal(isExpanded ? null : deal.id);
                onDealClick?.(deal.id);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getDealTypeIcon(deal.deal_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {deal.npc?.name || 'Unknown'} - {deal.item}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(deal.status)}`}>
                        {deal.status}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${riskColors.bg} ${riskColors.text} ${riskColors.border}`}>
                        {riskColors.label} Risk
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Due</span>
                  </div>
                  <div className={`text-sm font-bold ${timeRemaining === 'Overdue' ? 'text-red-400' : 'text-amber-400'}`}>
                    {timeRemaining}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Value</span>
                  </div>
                  <div className="text-sm font-bold text-green-400">
                    £{deal.total_value.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                    <Briefcase className="w-3 h-3" />
                    <span>Qty</span>
                  </div>
                  <div className="text-sm font-bold text-slate-300">
                    {deal.quantity}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-slate-700 p-4 bg-slate-900/50 space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Deal Type</div>
                  <div className="text-sm text-slate-300 capitalize">{deal.deal_type}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Location</div>
                  <div className="text-sm text-slate-300">{deal.location}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Timeline</div>
                  <div className="text-sm text-slate-300">
                    Started: Day {deal.start_day} • Due: Day {deal.due_day}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Unit Price</div>
                  <div className="text-sm text-slate-300">
                    £{deal.price_per_unit.toLocaleString()} per unit
                  </div>
                </div>

                {deal.status === 'active' && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle complete deal action
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                    >
                      Complete Deal
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle cancel deal action
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary Stats */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Total Value</div>
            <div className="text-sm font-bold text-green-400">
              £{deals.reduce((sum, d) => sum + d.total_value, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Active Deals</div>
            <div className="text-sm font-bold text-blue-400">
              {deals.filter(d => d.status === 'active').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
