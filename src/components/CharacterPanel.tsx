import React, { useState } from 'react';
import { User, DollarSign, AlertCircle, Clock, MapPin, Edit2, Save, X, Target, Brain, Footprints, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { GameSession, PlayerInventory, Location } from '../types/game';
import { useGame } from '../context/GameContext';

interface CharacterPanelProps {
  session: GameSession;
  inventory: PlayerInventory;
  location: Location | null;
  onLocationClick?: () => void;
}

export default function CharacterPanel({ session, inventory, location, onLocationClick }: CharacterPanelProps) {
  const { updateCharacterInfo, transferToBank, withdrawFromBank } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [appearance, setAppearance] = useState(session.appearance || '');
  const [bio, setBio] = useState(session.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showBankTransfer, setShowBankTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [isAppearanceExpanded, setIsAppearanceExpanded] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  React.useEffect(() => {
    setAppearance(session.appearance || '');
    setBio(session.bio || '');
  }, [session.appearance, session.bio]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateCharacterInfo(appearance, bio);
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleDeposit = async () => {
    const amount = parseInt(transferAmount);
    if (amount > 0 && amount <= inventory.cash) {
      await transferToBank(amount);
      setTransferAmount('');
      setShowBankTransfer(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(transferAmount);
    if (amount > 0 && amount <= (inventory.bank_balance || 0)) {
      await withdrawFromBank(amount);
      setTransferAmount('');
      setShowBankTransfer(false);
    }
  };

  const handleCancel = () => {
    setAppearance(session.appearance || '');
    setBio(session.bio || '');
    setIsEditing(false);
  };
  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day % 7];
  };


  const getHeatColor = (level: number) => {
    if (level >= 7) return 'bg-red-500';
    if (level >= 4) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const formatTime = () => {
    const hour = session.current_hour % 12 || 12;
    const period = session.current_hour >= 12 ? 'PM' : 'AM';
    const minute = session.current_minute.toString().padStart(2, '0');
    return `${hour}:${minute} ${period}`;
  };

  const formatDate = () => {
    const dayName = getDayName(session.current_day);
    return `${dayName}, November ${6 + Math.floor(session.current_day / 24)}, 2024`;
  };

  return (
    <div className="glass-panel p-5 space-y-6">
      {/* Character Identity */}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-primary/30">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-mono font-black uppercase tracking-tight text-foreground">{session.player_name}</h3>
              <p className="text-xs font-mono text-muted-foreground">CRIMINAL OPERATIVE</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-primary/10 rounded transition-colors text-muted-foreground hover:text-primary"
              title="Edit character"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 p-4 bg-card/30 rounded-lg border border-border/50">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground mb-2">Appearance</label>
              <textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="Height, build, hair, distinguishing features..."
                className="w-full h-20 bg-secondary/50 border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground mb-2">Background</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your criminal background, skills, connections..."
                className="w-full h-24 bg-secondary/50 border border-border/50 rounded px-3 py-2 text-sm text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-muted text-background text-sm font-mono font-bold rounded transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-mono font-bold rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {(session.appearance || session.bio) && (
              <div className="space-y-3 p-4 bg-card/30 rounded-lg border border-border/30">
                {session.appearance && (
                  <div>
                    <button
                      onClick={() => setIsAppearanceExpanded(!isAppearanceExpanded)}
                      className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground mb-1.5 hover:text-primary transition-colors"
                    >
                      <span>Appearance</span>
                      {isAppearanceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <div className={`text-sm font-mono text-foreground/90 leading-relaxed overflow-hidden transition-all ${
                      isAppearanceExpanded ? 'max-h-[1000px]' : 'max-h-[60px]'
                    }`}>
                      {session.appearance}
                    </div>
                    {!isAppearanceExpanded && session.appearance.length > 150 && (
                      <div className="mt-1 text-xs font-mono text-muted-foreground/60">Click to expand...</div>
                    )}
                  </div>
                )}
                {session.bio && (
                  <div className={session.appearance ? 'pt-3 border-t border-border/30' : ''}>
                    <button
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                      className="w-full flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground mb-1.5 hover:text-primary transition-colors"
                    >
                      <span>Background</span>
                      {isBioExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <div className={`text-sm font-mono text-foreground/90 leading-relaxed overflow-hidden transition-all ${
                      isBioExpanded ? 'max-h-[1000px]' : 'max-h-[60px]'
                    }`}>
                      {session.bio}
                    </div>
                    {!isBioExpanded && session.bio.length > 150 && (
                      <div className="mt-1 text-xs font-mono text-muted-foreground/60">Click to expand...</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Core Stats */}
        <div className="space-y-4">
          <div className="text-xs font-mono font-black uppercase tracking-tight text-muted-foreground border-b border-border/30 pb-2">
            VITAL STATS
          </div>

          {/* Cash on Hand */}
          <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/5 rounded-lg border-2 border-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground">Cash</span>
            </div>
            <div className="text-3xl font-mono font-black text-primary">£{inventory.cash.toLocaleString()}</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">On hand (risky)</div>
          </div>

          {/* Bank Account */}
          <div className="p-3 bg-gradient-to-br from-secondary/10 to-card/50 rounded-lg border border-border/30">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground">Bank</span>
              </div>
              <button
                onClick={() => setShowBankTransfer(!showBankTransfer)}
                className="text-xs font-mono text-accent hover:text-accent/80 transition"
              >
                {showBankTransfer ? 'Cancel' : 'Transfer'}
              </button>
            </div>
            <div className="text-xl font-mono font-black text-accent">£{inventory.bank_balance?.toLocaleString() || '0'}</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">Safe storage</div>

            {showBankTransfer && (
              <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full px-2 py-1 bg-input border border-border rounded text-xs font-mono text-foreground"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeposit}
                    disabled={!transferAmount || parseInt(transferAmount) > inventory.cash}
                    className="flex-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-mono rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Deposit
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!transferAmount || parseInt(transferAmount) > (inventory.bank_balance || 0)}
                    className="flex-1 px-2 py-1 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-mono rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Heat Level */}
          <div className="group relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 text-destructive ${session.heat_level >= 7 ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground">Heat Level</span>
              </div>
              <span className={`text-sm font-mono font-black ${session.heat_level >= 7 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                {session.heat_level}/10
              </span>
            </div>
            <div className={`h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/30 ${session.heat_level >= 7 ? 'ring-2 ring-destructive/50 animate-pulse' : ''}`}>
              <div
                className={`h-full ${getHeatColor(session.heat_level)} transition-all duration-500`}
                style={{ width: `${(session.heat_level / 10) * 100}%` }}
              />
            </div>
            <div className="absolute -top-10 left-0 bg-card border border-border text-xs font-mono text-foreground px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              Police attention level
            </div>
          </div>
        </div>


        {/* Skills & Attributes */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-black uppercase tracking-tight text-muted-foreground border-b border-border/30 pb-2">
            ATTRIBUTES
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-card/30 rounded-lg border border-border/30 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Combat</span>
              </div>
              <div className="text-xl font-mono font-black text-foreground">7</div>
            </div>

            <div className="p-3 bg-card/30 rounded-lg border border-border/30 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Footprints className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Stealth</span>
              </div>
              <div className="text-xl font-mono font-black text-foreground">6</div>
            </div>

            <div className="p-3 bg-card/30 rounded-lg border border-border/30 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Intel</span>
              </div>
              <div className="text-xl font-mono font-black text-foreground">5</div>
            </div>

            <div className="p-3 bg-card/30 rounded-lg border border-border/30 hover:border-primary/30 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold uppercase text-muted-foreground">Street</span>
              </div>
              <div className="text-xl font-mono font-black text-foreground">{session.reputation}</div>
            </div>
          </div>
        </div>

        {/* Location & Time */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-black uppercase tracking-tight text-muted-foreground border-b border-border/30 pb-2">
            CURRENT STATUS
          </div>

          <div
            className={`p-3 bg-card/30 rounded-lg border border-border/30 ${onLocationClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
            onClick={onLocationClick}
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground">Location</span>
            </div>
            <div className="text-base font-mono font-black text-foreground">{location?.name || 'Unknown'}</div>
            {location?.region && <div className="text-xs font-mono text-muted-foreground mt-0.5">{location.region}</div>}
          </div>

          <div className="p-3 bg-card/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold uppercase tracking-wide text-muted-foreground">Time</span>
            </div>
            <div className="text-base font-mono font-black text-foreground">{formatTime()}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">{getDayName(session.current_day)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
