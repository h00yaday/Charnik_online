import { useState } from 'react';
import type { Character } from '../../../types/character';
import { SKILLS, STATS } from '../../../constants/dnd';
import { getModifier, formatMod } from '../../../utils/math';

interface Props {
  character: Character;
  profBonus: number;
  onToggleSkill: (skillId: string) => void;
  onToggleSave: (statId: string) => void;
  onUpdateStat: (statId: string, value: number) => void;
}

const STAT_LABELS_SHORT: Record<string, string> = {
  strength: 'СИЛ',
  dexterity: 'ЛОВ',
  constitution: 'ТЕЛ',
  intelligence: 'ИНТ',
  wisdom: 'МУД',
  charisma: 'ХАР'
};

export default function StatsTab({ character, profBonus, onToggleSkill, onToggleSave, onUpdateStat }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`text-xs font-bold px-4 py-2 rounded transition-colors ${
            isEditing 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30' 
              : 'bg-slate-800 text-slate-300 border border-slate-600 hover:border-amber-400 hover:text-amber-300'
          }`}
        >
          {isEditing ? 'Готово (Редактирование включено)' : 'Изменить статы, навыки и спасброски'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ЛЕВЫЙ БЛОК: Характеристики и Спасброски (без изменений) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {STATS.map(stat => {
            const statId = stat.id;
            const score = character[statId as keyof Character] as number;
            const mod = getModifier(score);
            const statLabel = STAT_LABELS_SHORT[statId];
            const profLevelSave = character.saving_throws[statId] || 0;
            const totalSaveBonus = mod + (profLevelSave * profBonus);

            return (
              <div key={statId} className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-lg group relative">
                <div className="text-center mb-3">
                  <span className="text-xs font-black text-slate-500 tracking-widest block">{statLabel}</span>
                  <span className="text-4xl font-black text-slate-200 block drop-shadow-md">{formatMod(mod)}</span>
                  {isEditing ? (
                    <div className="mt-2 flex justify-center items-center gap-1.5 bg-slate-900 rounded-full px-2 py-0.5 mx-auto w-max border border-slate-700/50">
                      <button onClick={() => onUpdateStat(statId, score - 1)} className="text-slate-500 hover:text-red-400 font-bold text-lg leading-none px-1.5">-</button>
                      <span className="text-xs font-mono text-amber-400 w-5 text-center">{score}</span>
                      <button onClick={() => onUpdateStat(statId, score + 1)} className="text-slate-500 hover:text-green-400 font-bold text-lg leading-none px-1.5">+</button>
                    </div>
                  ) : (
                    <div className="mt-1 flex justify-center">
                      <div className="bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-700/50">
                        <span className="text-xs font-mono text-amber-500">{score}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div 
                  onClick={() => isEditing && onToggleSave(statId)}
                  className={`flex items-center justify-between p-2 rounded transition-colors group ${
                    isEditing ? 'cursor-pointer hover:bg-slate-700/50 bg-slate-900/30' : 'cursor-default bg-slate-900/50'
                  }`}
                  title={isEditing ? `Переключить владение спасброском ${statLabel}` : ''}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${profLevelSave > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-950'}`}>
                      {profLevelSave > 0 && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_#fbbf24]" />}
                    </div>
                    <span className={`text-xs ${profLevelSave > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>Спасбросок</span>
                  </div>
                  <span className={`font-mono text-sm ${profLevelSave > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>{formatMod(totalSaveBonus)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ПРАВЫЙ БЛОК: Навыки (ОБНОВЛЕННЫЙ ВИЗУАЛ ВЛАДЕНИЯ) */}
        <div className="lg:col-span-7 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
          <h3 className="text-xl font-bold text-slate-300 mb-5 border-b border-slate-700 pb-3">Навыки</h3>
          <div className="space-y-1.5">
            {SKILLS.map(skill => {
              const statScore = character[skill.stat as keyof Character] as number;
              const mod = getModifier(statScore);
              const profLevel = character.skills[skill.id] || 0;
              const totalBonus = mod + (profLevel * profBonus);
              const skillStatLabel = STAT_LABELS_SHORT[skill.stat];

              return (
                <div 
                  key={skill.id} 
                  onClick={() => isEditing && onToggleSkill(skill.id)} 
                  className={`flex items-center justify-between p-2 rounded transition-colors group ${
                    isEditing ? 'cursor-pointer hover:bg-slate-700/50 bg-slate-900/30' : 'cursor-default hover:bg-slate-700/20'
                  }`}
                  title={isEditing ? `Переключить владение навыком ${skill.name}` : ''}
                >
                  <div className="flex items-center gap-3">
                    {/* Кружочек владения — Обновленный визуал */}
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${profLevel > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-900'}`}>
                      {/* Экспертность (2x): Две вертикальные точки */}
                      {profLevel === 2 && (
                        <div className="flex flex-col gap-0.5 justify-center items-center">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_3px_#fbbf24]" />
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_3px_#fbbf24]" />
                        </div>
                      )}
                      {/* Владение (1x): Одна центральная точка */}
                      {profLevel === 1 && <div className="w-2 h-2 bg-amber-400 rounded-full" />}
                    </div>
                    
                    <span className={`text-sm ${profLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>
                      {skill.name} <span className="text-xs text-slate-600 font-normal">({skillStatLabel})</span>
                    </span>
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