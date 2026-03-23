import type { Character } from '../../../types/character';
import { SKILLS, STATS } from '../../../constants/dnd';
import { getModifier, formatMod } from '../../../utils/math';

interface Props {
  character: Character;
  profBonus: number;
  onToggleSkill: (skillId: string) => void;
  onToggleSave: (statId: string) => void;
}

export default function StatsTab({ character, profBonus, onToggleSkill, onToggleSave }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-3 space-y-4">
        {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(statName => {
          const score = character[statName as keyof Character] as number;
          const mod = getModifier(score);
          const labels: any = { strength: 'СИЛ', dexterity: 'ЛОВ', constitution: 'ТЕЛ', intelligence: 'ИНТ', wisdom: 'МУД', charisma: 'ХАР' };
          return (
            <div key={statName} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg text-center relative overflow-hidden group">
              <span className="text-xs font-black text-slate-500 tracking-widest block mb-2">{labels[statName]}</span>
              <span className="text-4xl font-black text-slate-200 block drop-shadow-md">{formatMod(mod)}</span>
              <div className="mt-2 flex justify-center">
                <div className="bg-slate-950 px-3 py-1 rounded-full border border-slate-700/50"><span className="text-sm font-mono text-amber-400">{score}</span></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="md:col-span-5 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
        <h3 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2">Навыки</h3>
        <div className="space-y-1">
          {SKILLS.map(skill => {
            const statScore = character[skill.stat as keyof Character] as number;
            const profLevel = character.skills[skill.id] || 0;
            const totalBonus = getModifier(statScore) + (profLevel * profBonus);
            return (
              <div key={skill.id} onClick={() => onToggleSkill(skill.id)} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${profLevel > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-900'}`}>
                    {profLevel === 2 && <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_#fbbf24]" />}
                    {profLevel === 1 && <div className="w-2 h-2 bg-amber-400 rounded-full" />}
                  </div>
                  <span className={`text-sm ${profLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{skill.name}</span>
                </div>
                <span className={`font-mono text-sm ${profLevel > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>{formatMod(totalBonus)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-4 space-y-6">
         <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
            <h3 className="text-lg font-bold text-slate-300 mb-4 border-b border-slate-700 pb-2">Спасброски</h3>
            <div className="space-y-1">
              {STATS.map(stat => {
                const statScore = character[stat.id as keyof Character] as number;
                const profLevel = character.saving_throws[stat.id] || 0;
                const totalBonus = getModifier(statScore) + (profLevel * profBonus);
                return (
                  <div key={stat.id} onClick={() => onToggleSave(stat.id)} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${profLevel > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-900'}`}>
                        {profLevel > 0 && <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_#fbbf24]" />}
                      </div>
                      <span className={`text-sm ${profLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{stat.name}</span>
                    </div>
                    <span className={`font-mono text-sm ${profLevel > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>{formatMod(totalBonus)}</span>
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    </div>
  );
}