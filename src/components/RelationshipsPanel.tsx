import React, { useState } from 'react';
import { Users, User, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { Relationship } from '../types/game';
import { supabase } from '../services/supabase';

interface RelationshipsPanelProps {
  relationships: Relationship[];
  onNPCClick?: (npcId: string) => void;
}

export default function RelationshipsPanel({ relationships, onNPCClick }: RelationshipsPanelProps) {
  const [hoveredNPC, setHoveredNPC] = useState<string | null>(null);
  const [enrichingNPC, setEnrichingNPC] = useState<string | null>(null);

  const getTrustColor = (trust: number) => {
    if (trust >= 70) return 'bg-green-500';
    if (trust >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrustTextColor = (trust: number) => {
    if (trust >= 70) return 'text-green-400';
    if (trust >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allied':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'hostile':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      default:
        return <Minus className="w-3 h-3 text-yellow-400" />;
    }
  };

  const getRelationshipType = (npc: any) => {
    if (npc?.name === 'Mia Thompson') return 'Romantic';
    if (npc?.name === 'Dean') return 'Business Partner';
    if (npc?.role === 'crew_member') return 'Crew';
    return npc?.role || 'Contact';
  };

  const getNPCKnowledge = (npc: any) => {
    const knowledge: string[] = [];
    if (npc?.name === 'Dean') {
      knowledge.push('Your real identity');
      knowledge.push('Lab testing operation');
      knowledge.push('Sample origin');
    } else if (npc?.name === 'Mia Thompson') {
      knowledge.push('Your profession');
      knowledge.push('Penthouse location');
      knowledge.push('Personal history');
    } else if (npc?.name === 'Frankie') {
      knowledge.push('Your supplier status');
      knowledge.push('East End operations');
    }
    return knowledge.length > 0 ? knowledge.join(', ') : 'Limited information';
  };

  const getCurrentStatus = (npc: any, relationship: Relationship) => {
    if (npc?.name === 'Dean') return 'Sample Testing';
    if (npc?.name === 'Mia Thompson') return 'At penthouse';
    if (relationship.status === 'allied') return 'Allied';
    if (relationship.status === 'hostile') return 'Hostile';
    return 'Neutral';
  };

  const enrichNPC = async (npc: any) => {
    if (!npc?.id) return;

    setEnrichingNPC(npc.id);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiUrl = `${supabaseUrl}/functions/v1/generate-narrative`;

      const prompt = `Generate a detailed character bio for an NPC in a London drill/road culture game.

NPC Name: ${npc.name}
Current Role: ${npc.role || 'Unknown'}
Current Location: ${npc.location || 'London'}
Current Appearance: ${npc.appearance || 'Not specified'}
Current Personality: ${npc.personality || 'Not specified'}

Generate:
1. DETAILED APPEARANCE: Full physical description (age, clothing style, distinctive features, typical outfit)
2. DETAILED PERSONALITY: Character traits, mannerisms, speech patterns, attitude, motivations
3. BACKSTORY: Brief but rich background (one paragraph)

Keep it authentic to UK drill/road culture. Use UK names, slang, and cultural references.

Return ONLY a JSON object:
{
  "appearance": "detailed appearance here",
  "personality": "detailed personality here",
  "backstory": "backstory paragraph here"
}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: prompt,
          playerCharacter: {
            name: 'Damian',
            appearance: '',
            bio: '',
          },
          gameState: {
            location: npc.location || 'London',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let enrichedData;

        try {
          const jsonMatch = data.narrative.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            enrichedData = JSON.parse(jsonMatch[0]);
          } else {
            enrichedData = JSON.parse(data.narrative);
          }
        } catch {
          enrichedData = {
            appearance: data.narrative,
            personality: 'Generated content',
            backstory: ''
          };
        }

        await supabase
          .from('npcs')
          .update({
            appearance: enrichedData.appearance || npc.appearance,
            personality: enrichedData.personality || npc.personality,
            bio: enrichedData.backstory || '',
          })
          .eq('id', npc.id);

        alert(`${npc.name} has been enriched with AI-generated details!`);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to enrich NPC:', error);
      alert('Failed to enrich NPC');
    } finally {
      setEnrichingNPC(null);
    }
  };

  if (relationships.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-sm">No relationships established yet</p>
        <p className="text-slate-600 text-xs mt-2">Interact with NPCs to build connections</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {relationships.map((relationship) => {
        const npc = relationship.npc;
        const trustPercent = relationship.trust_score;
        const relationType = getRelationshipType(npc);
        const currentStatus = getCurrentStatus(npc, relationship);

        return (
          <div
            key={relationship.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            onClick={() => onNPCClick?.(relationship.npc_id)}
            onMouseEnter={() => setHoveredNPC(relationship.npc_id)}
            onMouseLeave={() => setHoveredNPC(null)}
          >
            <div className="flex items-start gap-3 mb-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>

              {/* NPC Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {npc?.name || 'Unknown Contact'}
                  </h4>
                  {getStatusIcon(relationship.status)}
                </div>
                <div className="text-xs text-slate-400 mb-1">{relationType}</div>
                <div className="text-xs text-slate-500">{currentStatus}</div>
              </div>

              {/* Trust Score */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-bold ${getTrustTextColor(trustPercent)}`}>
                  {trustPercent}%
                </div>
                <div className="text-xs text-slate-500">
                  {relationship.interaction_count} interactions
                </div>
              </div>
            </div>

            {/* Trust Bar */}
            <div className="mb-3">
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getTrustColor(trustPercent)} transition-all duration-500`}
                  style={{ width: `${trustPercent}%` }}
                />
              </div>
            </div>

            {/* NPC Details (on hover) */}
            {hoveredNPC === relationship.npc_id && (
              <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                {npc?.appearance && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Appearance:</div>
                    <div className="text-xs text-slate-300">{npc.appearance}</div>
                  </div>
                )}

                {npc?.personality && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Personality:</div>
                    <div className="text-xs text-slate-300">{npc.personality}</div>
                  </div>
                )}

                {npc?.bio && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Background:</div>
                    <div className="text-xs text-slate-300">{npc.bio}</div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-slate-500 mb-1">What they know:</div>
                  <div className="text-xs text-slate-400">{getNPCKnowledge(npc)}</div>
                </div>

                {npc && (!npc.appearance || !npc.personality || npc.appearance?.length < 30) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      enrichNPC(npc);
                    }}
                    disabled={enrichingNPC === npc.id}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs font-mono text-purple-400 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {enrichingNPC === npc.id ? 'Generating...' : 'Enrich with AI'}
                  </button>
                )}
              </div>
            )}

            {/* Location */}
            {npc?.location && (
              <div className="mt-2 text-xs text-slate-600">
                Last seen: {npc.location}
              </div>
            )}
          </div>
        );
      })}

      {/* Summary Stats */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-slate-500">Allied</div>
            <div className="text-sm font-bold text-green-400">
              {relationships.filter(r => r.status === 'allied').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Neutral</div>
            <div className="text-sm font-bold text-yellow-400">
              {relationships.filter(r => r.status === 'neutral').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Hostile</div>
            <div className="text-sm font-bold text-red-400">
              {relationships.filter(r => r.status === 'hostile').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
