import { useState } from 'react';
import type { Character } from '../../types/character';
import { getProfBonus, formatMod } from '../../utils/math';

// Импортируем наши новые компоненты вкладок
import CharacterHeader from './components/CharacterHeader';
import StatsTab from './components/StatsTab';
import CombatTab from './components/CombatTab';
import SpellsTab from './components/SpellsTab';
import FeaturesTab from './components/FeaturesTab';

interface Props { character: Character; token: string; onBack: () => void; }

export default function CharacterSheet({ character, token, onBack }: Props) {
  const [localChar, setLocalChar] = useState<Character>({
    ...character, skills: character.skills || {}, saving_throws: character.saving_throws || {}, spell_slots: character.spell_slots || {}, features: character.features || []
  });
  const [activeTab, setActiveTab] = useState<'stats' | 'combat' | 'spells' | 'features'>('stats');
  const [rollResult, setRollResult] = useState<any | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showAttackForm, setShowAttackForm] = useState(false);
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attackForm, setAttackForm] = useState({ name: '', attack_bonus: 0, damage_dice: '1d8', damage_type: 'Рубящий' });
  const [spellForm, setSpellForm] = useState({ name: '', level: 0, description: '', damage_dice: '', damage_type: '' });

  const profBonus = getProfBonus(localChar.level);

  // --- API ФУНКЦИИ ---
  const updateField = async (field: string, value: any) => {
    setLocalChar(prev => ({ ...prev, [field]: value }));
    fetch(`http://localhost:8000/characters/${localChar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    }).catch(() => console.error('Ошибка сохранения'));
  };

  const toggleSkill = (skillId: string) => {
    const current = localChar.skills[skillId] || 0;
    const next = current === 0 ? 1 : current === 1 ? 2 : 0;
    updateField('skills', { ...localChar.skills, [skillId]: next });
  };

  const toggleSavingThrow = (statId: string) => {
    const current = localChar.saving_throws[statId] || 0;
    const next = current === 0 ? 1 : 0;
    updateField('saving_throws', { ...localChar.saving_throws, [statId]: next });
  };

  const updateHP = (amount: number) => {
    const newHp = Math.max(0, Math.min(localChar.max_hp, localChar.current_hp + amount));
    updateField('current_hp', newHp);
  };

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

  const submitAttack = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:8000/characters/${localChar.id}/attacks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(attackForm),
      });
      if (res.ok) {
        const newAttack = await res.json();
        setLocalChar(prev => ({ ...prev, attacks: [...prev.attacks, newAttack] }));
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
        const newSpell = await res.json();
        setLocalChar(prev => ({ ...prev, spells: [...prev.spells, newSpell] }));
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

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 animate-fade-in pb-10 font-sans relative">
      
      <CharacterHeader character={localChar} onBack={onBack} profBonus={profBonus} />

      {/* Навигация */}
      <div className="max-w-6xl mx-auto px-4 mt-6 flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'stats', label: 'Характеристики & Навыки' },
          { id: 'combat', label: 'Бой & Снаряжение' },
          { id: 'spells', label: 'Заклинания' },
          { id: 'features', label: 'Особенности' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-800 text-amber-400 border-t-2 border-amber-400' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ТЕЛО ЧАРНИКА */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {activeTab === 'stats' && (
          <StatsTab character={localChar} profBonus={profBonus} onToggleSkill={toggleSkill} onToggleSave={toggleSavingThrow} />
        )}
        {activeTab === 'combat' && (
          <CombatTab character={localChar} isRolling={isRolling} onUpdateHp={updateHP} onRoll={handleRoll} onAddAttack={() => setShowAttackForm(true)} onDeleteAttack={(id) => deleteItem('attacks', id)} />
        )}
        {activeTab === 'spells' && (
          <SpellsTab character={localChar} isRolling={isRolling} onAddSpell={() => setShowSpellForm(true)} onDeleteSpell={(id) => deleteItem('spells', id)} onRoll={handleRoll} />
        )}
        {activeTab === 'features' && (
          <FeaturesTab character={localChar} />
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