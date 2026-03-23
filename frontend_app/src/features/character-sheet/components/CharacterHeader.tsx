import type { Character } from '../../../types/character';
import { getModifier, formatMod } from '../../../utils/math';

interface Props {
  character: Character;
  onBack: () => void;
  profBonus: number;
}

export default function CharacterHeader({ character, onBack, profBonus }: Props) {
  return (
    <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <button onClick={onBack} className="text-slate-500 hover:text-amber-400 text-sm mb-3 transition-colors">← В таверну</button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 uppercase tracking-wider">{character.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 text-sm font-medium text-slate-400">
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{character.race}</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{character.character_class}</span>
              <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{character.background || 'Без предыстории'}</span>
              <span className="bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700/50">Ур. {character.level}</span>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 min-w-[80px]">
              <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Мастерство</span>
              <span className="text-xl font-bold text-emerald-400">{formatMod(profBonus)}</span>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 min-w-[80px]">
              <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Скорость</span>
              <span className="text-xl font-bold text-slate-200">{character.speed} фт.</span>
            </div>
            <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 min-w-[80px]">
              <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Инициатива</span>
              <span className="text-xl font-bold text-amber-400">{formatMod(getModifier(character.dexterity) + character.initiative_bonus)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}