import React from 'react';
import { Zap, Swords, Users, Skull, Eye, Car, Heart } from 'lucide-react';
import { PlayerSkill } from '../types/game';

interface SkillsPanelProps {
  skills: PlayerSkill[];
}

export default function SkillsPanel({ skills }: SkillsPanelProps) {
  const getSkillIcon = (skillName: string) => {
    switch (skillName) {
      case 'Combat':
        return <Swords className="w-4 h-4" />;
      case 'Negotiation':
        return <Users className="w-4 h-4" />;
      case 'Intimidation':
        return <Skull className="w-4 h-4" />;
      case 'Stealth':
        return <Eye className="w-4 h-4" />;
      case 'Streetwise':
        return <Zap className="w-4 h-4" />;
      case 'Driving':
        return <Car className="w-4 h-4" />;
      case 'Resilience':
        return <Heart className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'combat':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'social':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'criminal':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'survival':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getProgressColor = (level: number) => {
    if (level >= 8) return 'bg-amber-500';
    if (level >= 5) return 'bg-green-500';
    if (level >= 3) return 'bg-blue-500';
    return 'bg-slate-500';
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    const category = skill.skill_category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, PlayerSkill[]>);

  const categoryOrder = ['combat', 'social', 'criminal', 'survival'];
  const categoryLabels: Record<string, string> = {
    combat: 'Combat',
    social: 'Social',
    criminal: 'Criminal',
    survival: 'Survival'
  };

  if (skills.length === 0) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-mono font-black uppercase tracking-tight text-foreground">Skills</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground font-mono text-sm">
          No skills available. Skills are being initialized...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-mono font-black uppercase tracking-tight text-foreground">Skills</h2>
      </div>

      <div className="text-xs font-mono text-muted-foreground mb-4">
        Skills improve through gameplay actions. Higher levels affect outcomes.
      </div>

      {categoryOrder.map(category => {
        const categorySkills = groupedSkills[category];
        if (!categorySkills || categorySkills.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            <div className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-1 rounded border ${getCategoryColor(category)}`}>
              {categoryLabels[category]}
            </div>

            <div className="space-y-2">
              {categorySkills.map(skill => (
                <div
                  key={skill.id}
                  className="p-3 bg-card/30 border border-border/30 rounded-lg hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${getCategoryColor(skill.skill_category)}`}>
                        {getSkillIcon(skill.skill_name)}
                      </div>
                      <div>
                        <div className="text-sm font-mono font-bold text-foreground">{skill.skill_name}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          Used {skill.times_used} time{skill.times_used !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-black text-primary">{skill.level}</div>
                      <div className="text-xs font-mono text-muted-foreground">LEVEL</div>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  {skill.level < 10 && (
                    <div className="mb-2">
                      <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                        <span>XP</span>
                        <span>{skill.experience} / {skill.experience_to_next}</span>
                      </div>
                      <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(skill.level)} transition-all`}
                          style={{ width: `${(skill.experience / skill.experience_to_next) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {skill.level >= 10 && (
                    <div className="text-xs font-mono text-amber-500 font-bold">
                      MAX LEVEL
                    </div>
                  )}

                  {skill.description && (
                    <div className="text-xs font-mono text-muted-foreground mt-2 italic">
                      {skill.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Total Skill Points */}
      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono font-bold text-muted-foreground uppercase">Total Skill Points</span>
          <span className="text-xl font-mono font-black text-primary">
            {skills.reduce((sum, s) => sum + s.level, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
