import React, { useState } from 'react';
import { User, MapPin, Clock, Users, Maximize2, Minimize2, Send, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { ConversationMessage, GameSession, Location } from '../types/game';

interface StoryPanelProps {
  messages: ConversationMessage[];
  session: GameSession;
  location: Location | null;
  isProcessing: boolean;
  userInput?: string;
  onInputChange?: (value: string) => void;
  onSubmit?: () => void;
  enhanceRP?: boolean;
  onEnhanceRPChange?: (value: boolean) => void;
  suggestedActions?: string[];
}

export default function StoryPanel({
  messages,
  session,
  location,
  isProcessing,
  userInput = '',
  onInputChange,
  onSubmit,
  enhanceRP = false,
  onEnhanceRPChange,
  suggestedActions = []
}: StoryPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Set<number>>(new Set());

  const toggleReasoning = (idx: number) => {
    const newExpanded = new Set(expandedReasoning);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedReasoning(newExpanded);
  };

  const getSpeakerColor = (speaker: string) => {
    if (speaker === 'You') return 'border-blue-500';
    if (speaker === 'Narrator') return 'border-amber-600';
    if (speaker === 'System') return 'border-red-800';
    return 'border-purple-600';
  };

  const getSpeakerBg = (speaker: string) => {
    if (speaker === 'You') return 'bg-blue-900/30';
    if (speaker === 'Narrator') return 'bg-slate-800';
    if (speaker === 'System') return 'bg-red-950/50';
    return 'bg-purple-900/30';
  };

  const getSpeakerIcon = (speaker: string) => {
    if (speaker === 'You') return <User className="w-4 h-4 text-blue-400" />;
    return <Users className="w-4 h-4 text-amber-400" />;
  };

  const formatTime = () => {
    const hour = session.current_hour % 12 || 12;
    const period = session.current_hour >= 12 ? 'PM' : 'AM';
    const minute = session.current_minute.toString().padStart(2, '0');
    return `${hour}:${minute} ${period}`;
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day % 7];
  };

  return (
    <>
      <div className={`glass-panel overflow-hidden flex flex-col ${isFullscreen ? '' : 'flex-1'}`}>
        {/* Context Header */}
        <div className="bg-secondary/30 px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-mono font-black uppercase tracking-tight text-primary">Story</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{location?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{getDayName(session.current_day)}, {formatTime()}</span>
                </div>
              </div>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-primary/10 rounded transition-colors text-muted-foreground hover:text-primary"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className={`overflow-y-auto p-4 md:p-6 space-y-4 bg-card/30 ${isFullscreen ? 'h-[70vh]' : 'flex-1 min-h-[500px]'}`}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-lg space-y-4">
                <div className="space-y-3">
                  <p className="text-foreground text-base leading-relaxed font-mono">
                    The rain-soaked streets of London stretch before you. Your phone buzzes with opportunity.
                    The underworld doesn't wait.
                  </p>
                  <p className="text-muted-foreground text-sm font-mono">
                    You're in <span className="text-primary font-semibold">{location?.name || 'East End'}</span>,
                    the perfect place to start building your empire.
                  </p>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground/60 font-mono">Type your action below to begin your story</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="animate-fade-in">
                {msg.message_type === 'narrative' || msg.message_type === 'dialogue' ? (
                  <div className="space-y-2">
                    {msg.reasoning && (
                      <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleReasoning(idx)}
                          className="w-full px-4 py-2 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-bold uppercase tracking-wider font-mono text-purple-400">
                              AI Reasoning
                            </span>
                            <span className="text-xs text-purple-400/60 font-mono">
                              (Debug Info)
                            </span>
                          </div>
                          {expandedReasoning.has(idx) ? (
                            <ChevronDown className="w-4 h-4 text-purple-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-purple-400" />
                          )}
                        </button>
                        {expandedReasoning.has(idx) && (
                          <div className="px-4 py-3 border-t border-purple-500/30 bg-purple-950/50">
                            <pre className="text-xs text-purple-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                              {msg.reasoning}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`${getSpeakerBg(msg.speaker)} border-l-4 ${getSpeakerColor(msg.speaker)} p-4 md:p-5 rounded-lg bg-card/50 backdrop-blur-sm`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getSpeakerIcon(msg.speaker)}
                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">
                          {msg.speaker}
                        </span>
                        <span className="text-xs text-muted-foreground/50 font-mono">
                          {formatTime()}
                        </span>
                      </div>
                      <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap font-mono">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ) : msg.message_type === 'action' ? (
                  <div className="bg-primary/10 border-l-4 border-primary p-4 md:p-5 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-primary">You</span>
                    </div>
                    <p className="text-foreground text-base font-medium pl-6 font-mono">
                      {msg.message}
                    </p>
                  </div>
                ) : (
                  <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider font-mono text-destructive">System</span>
                    </div>
                    <p className="text-destructive text-sm font-mono">{msg.message}</p>
                  </div>
                )}
              </div>
            ))
          )}

          {isProcessing && (
            <div className="bg-secondary/50 border-l-4 border-primary p-4 md:p-5 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <div className="absolute inset-0 animate-ping w-4 h-4 border-2 border-primary/30 rounded-full"></div>
                </div>
                <div>
                  <p className="text-foreground text-sm font-mono font-bold">AI is thinking...</p>
                  <p className="text-muted-foreground text-xs font-mono">Analyzing situation and generating response</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col p-6">
          <div className="glass-panel overflow-hidden flex flex-col h-full">
            <div className="bg-secondary/30 px-6 py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-mono font-black uppercase tracking-tight text-primary">Story - Fullscreen</h2>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{location?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{getDayName(session.current_day)}, {formatTime()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="p-2 hover:bg-primary/10 rounded transition-colors text-muted-foreground hover:text-primary"
                    title="Exit fullscreen"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5 bg-card/30">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-2xl space-y-6">
                    <div className="space-y-4">
                      <p className="text-foreground text-xl leading-relaxed font-mono">
                        The rain-soaked streets of London stretch before you. Your phone buzzes with opportunity.
                        The underworld doesn't wait.
                      </p>
                      <p className="text-muted-foreground text-base font-mono">
                        You're in <span className="text-primary font-semibold">{location?.name || 'East End'}</span>,
                        the perfect place to start building your empire.
                      </p>
                    </div>
                    <div className="pt-6 border-t border-border/30">
                      <p className="text-sm text-muted-foreground/60 font-mono">Type your action below to begin your story</p>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="animate-fade-in max-w-4xl mx-auto">
                    {msg.message_type === 'narrative' || msg.message_type === 'dialogue' ? (
                      <div className="space-y-3">
                        {msg.reasoning && (
                          <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleReasoning(idx)}
                              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-purple-500/10 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-bold uppercase tracking-wider font-mono text-purple-400">
                                  AI Reasoning
                                </span>
                                <span className="text-xs text-purple-400/60 font-mono">
                                  (Debug Info)
                                </span>
                              </div>
                              {expandedReasoning.has(idx) ? (
                                <ChevronDown className="w-4 h-4 text-purple-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-purple-400" />
                              )}
                            </button>
                            {expandedReasoning.has(idx) && (
                              <div className="px-4 py-3 border-t border-purple-500/30 bg-purple-950/50">
                                <pre className="text-sm text-purple-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                                  {msg.reasoning}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`${getSpeakerBg(msg.speaker)} border-l-4 ${getSpeakerColor(msg.speaker)} p-6 rounded-lg bg-card/50 backdrop-blur-sm`}>
                          <div className="flex items-center gap-2 mb-3">
                            {getSpeakerIcon(msg.speaker)}
                            <span className="text-sm font-bold uppercase tracking-wider font-mono text-muted-foreground">
                              {msg.speaker}
                            </span>
                            <span className="text-sm text-muted-foreground/50 font-mono">
                              {formatTime()}
                            </span>
                          </div>
                          <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap font-mono">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ) : msg.message_type === 'action' ? (
                      <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-primary" />
                          <span className="text-sm font-bold uppercase tracking-wider font-mono text-primary">You</span>
                        </div>
                        <p className="text-foreground text-lg font-medium pl-7 font-mono">
                          {msg.message}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-destructive/10 border-l-4 border-destructive p-5 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold uppercase tracking-wider font-mono text-destructive">System</span>
                        </div>
                        <p className="text-destructive text-base font-mono">{msg.message}</p>
                      </div>
                    )}
                  </div>
                ))
              )}

              {isProcessing && (
                <div className="bg-secondary/50 border-l-4 border-primary p-6 rounded-lg backdrop-blur-sm max-w-4xl mx-auto">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                      <div className="absolute inset-0 animate-ping w-5 h-5 border-2 border-primary/30 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-foreground text-base font-mono font-bold">AI is thinking...</p>
                      <p className="text-muted-foreground text-sm font-mono">Analyzing situation and generating response</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Controls in Fullscreen */}
            {onInputChange && onSubmit && (
              <div className="border-t border-border/50 bg-card/50 p-6">
                <div className="max-w-4xl mx-auto">
                  {onEnhanceRPChange && (
                    <div className="flex items-center gap-2 mb-3">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary transition">
                        <input
                          type="checkbox"
                          checked={enhanceRP}
                          onChange={(e) => onEnhanceRPChange(e.target.checked)}
                          className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-primary"
                        />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">Enhance RP</span>
                      </label>
                      {enhanceRP && (
                        <span className="text-xs text-primary/70 italic font-mono">
                          (Transform to character speech)
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex gap-3 mb-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={e => onInputChange(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && !isProcessing && userInput.trim() && onSubmit()}
                      placeholder="What do you do?"
                      className="flex-1 px-4 py-3 bg-input border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary font-mono text-base"
                      disabled={isProcessing}
                      autoFocus
                    />
                    <button
                      onClick={onSubmit}
                      disabled={isProcessing || !userInput.trim()}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded font-mono font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      ACT
                    </button>
                  </div>
                  {suggestedActions.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => onInputChange(action)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-secondary border border-border rounded text-xs text-secondary-foreground hover:bg-secondary/80 hover:border-primary/30 transition disabled:opacity-50 font-mono"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
