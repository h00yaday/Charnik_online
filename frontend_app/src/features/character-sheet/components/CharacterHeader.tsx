import { useState, useEffect } from 'react'; 
import type { Character } from '../../../types/character';
import { getModifier } from '../../../utils/math';

interface Props {
  character: Character;
  onBack: () => void;
  profBonus: number;
  onLongRest: () => void;
  onShortRest: () => void;
  onUpdateLevel: (newLevel: number) => void; // <-- НОВЫЙ ПРОПС
}

export default function CharacterHeader({ character, onBack, profBonus, onLongRest, onShortRest, onUpdateLevel }: Props) {
  // Состояния для режима редактирования уровня
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [tempLevel, setTempLevel] = useState(character.level);

  // Синхронизируем локальный стейт, если уровень обновился снаружи
  useEffect(() => {
    setTempLevel(character.level);
  }, [character.level]);

  const handleSaveLevel = () => {
    if (tempLevel !== character.level) {
      onUpdateLevel(tempLevel);
    }
    setIsEditingLevel(false);
  };

  // Высчитываем процент ХП для цвета полоски здоровья
  const hpPercentage = Math.round((character.current_hp / character.max_hp) * 100);
  let hpColor = 'bg-green-500';
  if (hpPercentage <= 50) hpColor = 'bg-amber-500';
  if (hpPercentage <= 20) hpColor = 'bg-red-500';

  const dexMod = getModifier(character.dexterity);
  const totalInitiative = dexMod + (character.initiative_bonus || 0);
  return (
    <div className="bg-slate-900 border-b border-slate-800 pt-6 pb-6 px-4 sticky top-0 z-40 shadow-xl">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

        {/* ЛЕВАЯ ЧАСТЬ: Имя и класс */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="w-10 h-10 shrink-0 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            ←
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-1">{character.name}</h1>
            
            <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
              <span>{character.race} • {character.character_class} {character.subclass && `(${character.subclass})`} •</span>
              
              {/* БЛОК УРОВНЯ */}
              {isEditingLevel ? (
                <div className="flex items-center gap-2 bg-slate-800 rounded px-1 py-0.5 border border-slate-600">
                  <button onClick={() => setTempLevel(Math.max(1, tempLevel - 1))} className="text-slate-400 hover:text-red-400 font-bold px-1">-</button>
                  <span className="text-white font-bold w-4 text-center">{tempLevel}</span>
                  <button onClick={() => setTempLevel(Math.min(20, tempLevel + 1))} className="text-slate-400 hover:text-green-400 font-bold px-1">+</button>
                  <button onClick={handleSaveLevel} className="ml-2 text-xs text-blue-400 hover:text-blue-300 font-bold">ОК</button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                   <span>Уровень {character.level}</span>
                   <button 
                     onClick={() => setIsEditingLevel(true)} 
                     className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 hover:text-blue-400 transition-all px-1"
                     title="Изменить уровень"
                   >
                     ✎
                   </button>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* ЦЕНТРАЛЬНАЯ ЧАСТЬ: Базовые статы (Без изменений) */}
        <div className="flex gap-3">
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">КД</span>
            <span className="text-2xl font-black text-amber-400">{character.armor_class}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Иниц.</span>
            <span className="text-2xl font-black text-amber-400">
              {totalInitiative >= 0 ? `+${totalInitiative}` : totalInitiative}
            </span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">Скор.</span>
            <span className="text-2xl font-black text-amber-400">{character.speed}</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-xl text-center border border-slate-700">
            <span className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5 tracking-wider">БМ</span>
            <span className="text-2xl font-black text-amber-400">+{profBonus}</span>
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Здоровье и Отдых (Без изменений) */}
        <div className="w-full md:w-72 flex flex-col gap-2">
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 relative overflow-hidden">
            <div className="flex justify-between items-end relative z-10 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Хит-поинты</span>
              <div className="text-right leading-none">
                <span className="text-2xl font-black text-white">{character.current_hp}</span>
                <span className="text-slate-500 font-bold text-sm"> / {character.max_hp}</span>
              </div>
            </div>
            {/* Полоска здоровья */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden relative z-10">
              <div className={`h-full ${hpColor} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }} />
            </div>
          </div>

          {/* Кнопки отдыха */}
          <div className="flex gap-2">
            <button
              onClick={onShortRest}
              className="flex-1 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Короткий
            </button>
            <button
              onClick={onLongRest}
              className="flex-1 py-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
            >
              Длинный
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}