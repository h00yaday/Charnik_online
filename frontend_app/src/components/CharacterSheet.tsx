import { useState } from 'react';

// --- ИНТЕРФЕЙСЫ ---
interface Attack { id: number; name: string; attack_bonus: number; damage_dice: string; damage_type: string; }
interface Spell { id: number; name: string; level: number; description: string; damage_dice?: string; damage_type?: string; }
interface Feature { id: number; name: string; description: string; source: string; }

interface Character {
  id: number; name: string; level: number;
  race: string; character_class: string; subclass?: string; background?: string;
  max_hp: number; current_hp: number; armor_class: number; speed: number; initiative_bonus: number;
  strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number;
  skills: Record<string, number>; saving_throws: Record<string, number>; spell_slots: Record<string, number>;
  attacks: Attack[]; spells: Spell[]; features: Feature[];
}

interface Props { character: Character; token: string; onBack: () => void; }

// --- КОНСТАНТЫ D&D ---
const SKILLS = [
  { id: 'acrobatics', name: 'Акробатика', stat: 'dexterity' },
  { id: 'animal_handling', name: 'Уход за животными', stat: 'wisdom' },
  { id: 'arcana', name: 'Магия', stat: 'intelligence' },
  { id: 'athletics', name: 'Атлетика', stat: 'strength' },
  { id: 'deception', name: 'Обман', stat: 'charisma' },
  { id: 'history', name: 'История', stat: 'intelligence' },
  { id: 'insight', name: 'Проницательность', stat: 'wisdom' },
  { id: 'intimidation', name: 'Запугивание', stat: 'charisma' },
  { id: 'investigation', name: 'Анализ', stat: 'intelligence' },
  { id: 'medicine', name: 'Медицина', stat: 'wisdom' },
  { id: 'nature', name: 'Природа', stat: 'intelligence' },
  { id: 'perception', name: 'Восприятие', stat: 'wisdom' },
  { id: 'performance', name: 'Выступление', stat: 'charisma' },
  { id: 'persuasion', name: 'Убеждение', stat: 'charisma' },
  { id: 'religion', name: 'Религия', stat: 'intelligence' },
  { id: 'sleight_of_hand', name: 'Ловкость рук', stat: 'dexterity' },
  { id: 'stealth', name: 'Скрытность', stat: 'dexterity' },
  { id: 'survival', name: 'Выживание', stat: 'wisdom' },
];
const STATS = [
  { id: 'strength', name: 'Сила' },
  { id: 'dexterity', name: 'Ловкость' },
  { id: 'constitution', name: 'Телосложение' },
  { id: 'intelligence', name: 'Интеллект' },
  { id: 'wisdom', name: 'Мудрость' },
  { id: 'charisma', name: 'Харизма' }
];

export default function CharacterSheet({ character, token, onBack }: Props) {
  const [localChar, setLocalChar] = useState<Character>({
    ...character,
    skills: character.skills || {},
    saving_throws: character.saving_throws || {},
    spell_slots: character.spell_slots || {},
    features: character.features || []
  });
  
  const [activeTab, setActiveTab] = useState<'stats' | 'combat' | 'spells' | 'features'>('stats');
  
  // Состояния для бросков и модалок
  const [rollResult, setRollResult] = useState<any | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showAttackForm, setShowAttackForm] = useState(false);
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attackForm, setAttackForm] = useState({ name: '', attack_bonus: 0, damage_dice: '1d8', damage_type: 'Рубящий' });
  const [spellForm, setSpellForm] = useState({ name: '', level: 0, description: '', damage_dice: '', damage_type: '' });

  // D&D Математика
  const getModifier = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (mod?: number | null) => {
  if (mod === undefined || mod === null || isNaN(mod)) return "+0";
  return mod >= 0 ? `+${mod}` : mod.toString();
  };
  const profBonus = Math.ceil(localChar.level / 4) + 1;

  // --- API ФУНКЦИИ (Сохранение статов) ---
  const updateField = async (field: string, value: any) => {
    setLocalChar(prev => ({ ...prev, [field]: value }));
    fetch(`http://localhost:8000/characters/${localChar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => console.error('Ошибка сохранения'));
  };
  const toggleSavingThrow = (statId: string) => {
    // Для спасбросков владение обычно либо есть (1), либо нет (0)
    const current = localChar.saving_throws[statId] || 0;
    const next = current === 0 ? 1 : 0;
    updateField('saving_throws', { ...localChar.saving_throws, [statId]: next });
  };
  const toggleSkill = (skillId: string) => {
    const current = localChar.skills[skillId] || 0;
    const next = current === 0 ? 1 : current === 1 ? 2 : 0;
    updateField('skills', { ...localChar.skills, [skillId]: next });
  };

  const updateHP = (amount: number) => {
    const newHp = Math.max(0, Math.min(localChar.max_hp, localChar.current_hp + amount));
    updateField('current_hp', newHp);
  };

  // --- API ФУНКЦИИ (Броски) ---
  const handleRoll = async (url: string) => {
    setIsRolling(true);
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      
      if (response.status === 401) {
          alert('Время сессии истекло. Пожалуйста, войдите снова.');
          return;
      }

      if (!response.ok) throw new Error('Ошибка броска');
      setRollResult(await response.json());
    } catch (err) {
      alert('Не удалось бросить кубики :(');
    } finally {
      setIsRolling(false);
    }
  };

  // --- API ФУНКЦИИ (Добавление/Удаление) ---
  const submitAttack = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/characters/${localChar.id}/attacks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(attackForm),
      });
      if (res.ok) {
        const newAttack = await res.json(); // Сначала дожидаемся ответа
        setLocalChar(prev => ({ ...prev, attacks: [...prev.attacks, newAttack] })); // Потом обновляем состояние
        setShowAttackForm(false); 
        setAttackForm({ name: '', attack_bonus: 0, damage_dice: '1d8', damage_type: 'Рубящий' });
      }
    } finally { setIsSubmitting(false); }
  };

  const submitSpell = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/characters/${localChar.id}/spells`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(spellForm),
      });
      if (res.ok) {
        const newSpell = await res.json(); // Сначала дожидаемся ответа
        setLocalChar(prev => ({ ...prev, spells: [...prev.spells, newSpell] })); // Потом обновляем состояние
        setShowSpellForm(false); 
        setSpellForm({ name: '', level: 0, description: '', damage_dice: '', damage_type: '' });
      }
    } finally { setIsSubmitting(false); }
  };

  const deleteItem = async (type: 'attacks' | 'spells', id: number) => {
    if (!window.confirm('Точно удалить?')) return;
    try {
      const res = await fetch(`http://localhost:8000/characters/${localChar.id}/${type}/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLocalChar(prev => ({ ...prev, [type]: (prev[type] as any[]).filter((item: any) => item.id !== id) }));
      }
    } catch (err) { alert('Ошибка удаления'); }
  };

  // --- РЕНДЕР ---
  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 animate-fade-in pb-10 font-sans relative">
      
      {/* ШАПКА ПЕРСОНАЖА */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button onClick={onBack} className="text-slate-500 hover:text-amber-400 text-sm mb-3 transition-colors">← В таверну</button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 uppercase tracking-wider">
                {localChar.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2 text-sm font-medium text-slate-400">
                <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{localChar.race}</span>
                <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{localChar.character_class} {localChar.subclass ? `(${localChar.subclass})` : ''}</span>
                <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">{localChar.background || 'Без предыстории'}</span>
                <span className="bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-700/50">Ур. {localChar.level}</span>
              </div>
            </div>

            <div className="flex gap-4 text-center">
              <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 min-w-[80px]">
                <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Мастерство</span>
                <span className="text-xl font-bold text-emerald-400">{formatMod(profBonus)}</span>
              </div>
              <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 min-w-[80px]">
                <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Скорость</span>
                <span className="text-xl font-bold text-slate-200">{localChar.speed} фт.</span>
              </div>
              <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 min-w-[80px]">
                <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Инициатива</span>
                <span className="text-xl font-bold text-amber-400">{formatMod(getModifier(localChar.dexterity) + localChar.initiative_bonus)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* НАВИГАЦИЯ */}
        <div className="max-w-6xl mx-auto px-4 mt-6 flex gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', label: 'Характеристики & Навыки' },
            { id: 'combat', label: 'Бой & Снаряжение' },
            { id: 'spells', label: 'Заклинания' },
            { id: 'features', label: 'Особенности' }
          ].map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-slate-800 text-amber-400 border-t-2 border-amber-400 shadow-[0_-4px_20px_-5px_rgba(251,191,36,0.3)]' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ТЕЛО ЧАРНИКА */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* ВКЛАДКА 1: ХАРАКТЕРИСТИКИ */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3 space-y-4">
              {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(statName => {
                const score = localChar[statName as keyof Character] as number;
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
                  const statScore = localChar[skill.stat as keyof Character] as number;
                  const profLevel = localChar.skills[skill.id] || 0;
                  const totalBonus = getModifier(statScore) + (profLevel * profBonus);
                  return (
                    <div key={skill.id} onClick={() => toggleSkill(skill.id)} className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${profLevel > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-900'}`}>
                          {profLevel === 2 && <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_#fbbf24]" />}
                          {profLevel === 1 && <div className="w-2 h-2 bg-amber-400 rounded-full" />}
                        </div>
                        <span className={`text-sm ${profLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{skill.name}</span>
                        <span className="text-[10px] text-slate-600 uppercase">({skill.stat.substring(0,3)})</span>
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
                  const statScore = localChar[stat.id as keyof Character] as number;
                  const profLevel = localChar.saving_throws[stat.id] || 0;
                  const totalBonus = getModifier(statScore) + (profLevel * profBonus);
          
                  return (
                    <div 
                      key={stat.id} 
                      onClick={() => toggleSavingThrow(stat.id)} 
                      className="flex items-center justify-between p-2 hover:bg-slate-700/50 rounded cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${profLevel > 0 ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600 bg-slate-900'}`}>
                          {profLevel > 0 && <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_5px_#fbbf24]" />}
                        </div>
                        <span className={`text-sm ${profLevel > 0 ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>{stat.name}</span>
                      </div>
                      <span className={`font-mono text-sm ${profLevel > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                        {formatMod(totalBonus)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* ВКЛАДКА 2: БОЙ */}
        {activeTab === 'combat' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 w-full h-2 bg-slate-900">
                 <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(localChar.current_hp / localChar.max_hp) * 100}%` }}></div>
               </div>
               <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-sm">Хитпоинты</h3>
               <div className="flex items-center gap-6">
                 <button onClick={() => updateHP(-1)} className="w-12 h-12 rounded-full bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white font-black text-xl transition-colors">-</button>
                 <div className="text-center">
                   <span className="text-6xl font-black text-slate-100">{localChar.current_hp}</span>
                   <span className="text-xl text-slate-500 font-bold"> / {localChar.max_hp}</span>
                 </div>
                 <button onClick={() => updateHP(1)} className="w-12 h-12 rounded-full bg-emerald-900/30 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-xl transition-colors">+</button>
               </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex items-center justify-center gap-8 shadow-xl">
               <div className="text-center">
                  <span className="text-sm text-slate-400 font-bold block mb-2 uppercase tracking-widest">Класс Доспеха</span>
                  <div className="w-24 h-28 mx-auto bg-slate-900 border-2 border-slate-600 rounded-t-full rounded-b-xl flex items-center justify-center relative">
                    <span className="text-4xl font-black text-blue-400">{localChar.armor_class}</span>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
                <h3 className="text-2xl font-black text-slate-200">Оружие и Атаки</h3>
                <button onClick={() => setShowAttackForm(true)} className="text-amber-400 hover:text-amber-300 font-bold text-sm">+ Добавить атаку</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localChar.attacks.map(attack => (
                  <div key={attack.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center group hover:border-orange-500/50 transition-colors">
                     <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg text-slate-200">{attack.name}</h4>
                          <button onClick={() => deleteItem('attacks', attack.id)} className="text-xs text-slate-600 hover:text-red-500 transition-colors">✕</button>
                        </div>
                        <div className="flex gap-3 mt-1 text-sm font-mono">
                           <span className="text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">Попадание: {formatMod(attack.attack_bonus)}</span>
                           <span className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/50">Урон: {attack.damage_dice} {attack.damage_type}</span>
                        </div>
                     </div>
                     <button onClick={() => handleRoll(`http://localhost:8000/characters/${localChar.id}/attacks/${attack.id}/roll`)} disabled={isRolling} className="h-12 w-24 bg-orange-600/20 text-orange-500 border border-orange-500/30 rounded-lg hover:bg-orange-600 hover:text-white font-black uppercase text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50">БИТЬ</button>
                  </div>
                ))}
                {localChar.attacks.length === 0 && <p className="text-slate-500 italic">Оружие не экипировано</p>}
              </div>
            </div>
      </div>
      )}

        {/* ВКЛАДКА 3: ЗАКЛИНАНИЯ */}
        {activeTab === 'spells' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
              <h3 className="text-2xl font-black text-slate-200">Книга заклинаний</h3>
              <button onClick={() => setShowSpellForm(true)} className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">+ Добавить заклинание</button>
            </div>
            
            {localChar.spells.length === 0 ? (
              <p className="text-slate-500 italic text-center py-6">Вы не знаете ни одного заклинания.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {localChar.spells.map(spell => (
                  <div key={spell.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-indigo-400 text-lg">{spell.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-bold">Ур. {spell.level}</span>
                          <button onClick={() => deleteItem('spells', spell.id)} className="text-slate-500 hover:text-red-400">✕</button>
                        </div>
                      </div>
                      {spell.damage_dice && <p className="text-xs text-red-400 font-mono mb-2 bg-red-900/10 inline-block px-2 py-1 rounded">Урон: {spell.damage_dice} {spell.damage_type}</p>}
                      {spell.description && <p className="text-xs text-slate-400 mt-1 line-clamp-3 mb-4">{spell.description}</p>}
                    </div>
                    {spell.damage_dice && (
                      <button onClick={() => handleRoll(`http://localhost:8000/characters/${localChar.id}/spells/${spell.id}/roll`)} disabled={isRolling} className="w-full mt-auto py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-sm font-bold uppercase tracking-wider">Кастовать</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА 4: ОСОБЕННОСТИ */}
        {activeTab === 'features' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
              <h3 className="text-2xl font-black text-slate-200">Особенности и Черты</h3>
            </div>
            {localChar.features.length === 0 ? (
              <p className="text-slate-500 italic text-center py-6">У вас пока нет особенностей.</p>
            ) : (
              <div className="space-y-4">
                {localChar.features.map(f => (
                  <div key={f.id} className="bg-slate-900 rounded-xl p-5 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1 block">{f.source}</span>
                    <h4 className="font-bold text-xl text-slate-200 mb-2">{f.name}</h4>
                    <p className="text-slate-400 text-sm whitespace-pre-wrap">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- МОДАЛЬНЫЕ ОКНА --- */}
      
      {/* РЕЗУЛЬТАТ БРОСКА */}
      {rollResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative max-w-sm w-full transform transition-all scale-100">
            <button onClick={() => setRollResult(null)} className="absolute top-4 right-5 text-slate-400 hover:text-white text-xl">✕</button>
            <h3 className="text-center font-black text-amber-500 tracking-widest uppercase text-sm mb-6">{rollResult.action}</h3>
            
            <div className="space-y-6">
              <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Попадание</p>
                <div className="text-4xl font-black mb-1">
                  <span className={rollResult.hit_roll?.is_critical ? "text-amber-400" : rollResult.hit_roll?.is_critical_fail ? "text-red-500" : "text-slate-200"}>
                    {rollResult.hit_roll?.d20_face}
                  </span>
                  <span className="text-xl text-slate-600 mx-2">{formatMod(rollResult.hit_roll?.bonus)}</span>
                  <span className="text-3xl text-blue-400">= {rollResult.hit_roll?.total}</span>
                </div>
                {rollResult.hit_roll?.is_critical && <span className="text-xs font-bold text-amber-400 animate-pulse">КРИТИЧЕСКОЕ ПОПАДАНИЕ!</span>}
                {rollResult.hit_roll?.is_critical_fail && <span className="text-xs font-bold text-red-500">КРИТИЧЕСКИЙ ПРОМАХ!</span>}
              </div>

              {rollResult.damage && (
                <div className="bg-slate-950/50 rounded-2xl p-4 border border-red-900/30 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay"></div>
                  <p className="text-xs text-red-400 uppercase font-bold mb-1">Урон ({rollResult.damage.type})</p>
                  <div className="text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    {rollResult.damage.total}
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setRollResult(null)} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Отлично!</button>
          </div>
        </div>
      )}

      {/* НОВАЯ АТАКА */}
      {showAttackForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-amber-400 mb-6 uppercase tracking-wider">Новое Оружие</h3>
            <form onSubmit={submitAttack} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Название</label>
                <input type="text" required value={attackForm.name} onChange={e => setAttackForm({...attackForm, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500" placeholder="Боевой молот" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Бонус (Попадание)</label>
                  <input type="number" required value={attackForm.attack_bonus} onChange={e => setAttackForm({...attackForm, attack_bonus: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-blue-500 text-center" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Кости урона</label>
                  <input type="text" required pattern="^\s*([+-]?\s*(\d+[dD]\d+|\d+)\s*)+$" value={attackForm.damage_dice} onChange={e => setAttackForm({...attackForm, damage_dice: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-red-500 text-center" placeholder="1d8 + 3" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Тип урона</label>
                <input type="text" required value={attackForm.damage_type} onChange={e => setAttackForm({...attackForm, damage_type: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500" placeholder="Дробящий" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAttackForm(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Отмена</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold disabled:opacity-50">Экипировать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* НОВОЕ ЗАКЛИНАНИЕ */}
      {showSpellForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-indigo-400 mb-6 uppercase tracking-wider">Изучить Заклинание</h3>
            <form onSubmit={submitSpell} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Название</label>
                  <input type="text" required value={spellForm.name} onChange={e => setSpellForm({...spellForm, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="Огненный шар" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Уровень</label>
                  <input type="number" min="0" max="9" required value={spellForm.level} onChange={e => setSpellForm({...spellForm, level: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500 text-center" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Урон (Опционально)</label>
                  <input type="text" pattern="^\s*([+-]?\s*(\d+[dD]\d+|\d+)\s*)+$" value={spellForm.damage_dice} onChange={e => setSpellForm({...spellForm, damage_dice: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-red-500 text-center" placeholder="8d6" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Тип урона</label>
                  <input type="text" value={spellForm.damage_type} onChange={e => setSpellForm({...spellForm, damage_type: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="Огонь" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Описание</label>
                <textarea rows={3} value={spellForm.description} onChange={e => setSpellForm({...spellForm, description: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500 resize-none" placeholder="Сфера огня взрывается..." />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowSpellForm(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Отмена</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50">Изучить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}