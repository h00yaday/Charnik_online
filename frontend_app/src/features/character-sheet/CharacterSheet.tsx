import { useState } from 'react';
import type { Character } from '../../types/character';
import { getProfBonus } from '../../utils/math';
import { fetchWithAuth } from '../../utils/api';

import CharacterHeader from './components/CharacterHeader';
import StatsTab from './components/StatsTab';
import CombatTab from './components/CombatTab';
import SpellsTab from './components/SpellsTab';
import FeaturesTab from './components/FeaturesTab';

// Импортируем наши новые чистые модалки
import RollModal from './components/modals/RollModal';
import AttackModal from './components/modals/AttackModal';
import SpellModal from './components/modals/SpellModal';

interface Props { character: Character; onBack: () => void; }

export default function CharacterSheet({ character,  onBack }: Props) {
  const [localChar, setLocalChar] = useState<Character>({
    ...character, skills: character.skills || {}, saving_throws: character.saving_throws || {}, spell_slots: character.spell_slots || {}, features: character.features || []
  });
  const [activeTab, setActiveTab] = useState<'stats' | 'combat' | 'spells' | 'features'>('stats');
  
  // Оставили только управление видимостью окон! Стейты самих форм теперь живут внутри модалок.
  const [rollResult, setRollResult] = useState<any | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showAttackModal, setShowAttackModal] = useState(false);
  const [showSpellModal, setShowSpellModal] = useState(false);

  const profBonus = getProfBonus(localChar.level);

  // --- API ФУНКЦИИ ---
  const updateField = async (field: string, value: any) => {
    setLocalChar(prev => ({ ...prev, [field]: value }));
    try {
      const response = await fetchWithAuth(`http://localhost:8000/characters/${localChar.id}`, {
        method: 'PATCH', body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Ошибка сохранения');
    } catch (err: any) {
      if (err.message !== 'Unauthorized') console.error('Ошибка сохранения данных', err);
    }
  };

  const toggleSkill = (skillId: string) => {
    const current = localChar.skills[skillId] || 0;
    updateField('skills', { ...localChar.skills, [skillId]: current === 0 ? 1 : current === 1 ? 2 : 0 });
  };

  const toggleSavingThrow = (statId: string) => {
    const current = localChar.saving_throws[statId] || 0;
    updateField('saving_throws', { ...localChar.saving_throws, [statId]: current === 0 ? 1 : 0 });
  };

  const updateHP = (amount: number) => {
    updateField('current_hp', Math.max(0, Math.min(localChar.max_hp, localChar.current_hp + amount)));
  };


  const handleRoll = async (url: string) => {
    setIsRolling(true);
    try {
      const response = await fetchWithAuth(url, { method: 'POST' });
      if (!response.ok) throw new Error('Ошибка броска');
      setRollResult(await response.json());
    } catch (err: any) {
      if (err.message !== 'Unauthorized') alert('Не удалось бросить кубики :(');
    } finally { setIsRolling(false); }
  };

  const submitAttack = async (attackData: any) => {
    try {
      const res = await fetchWithAuth(`http://localhost:8000/characters/${localChar.id}/attacks`, {
        method: 'POST', body: JSON.stringify(attackData),
      });
      if (res.ok) {
        const newAttack = await res.json();
        setLocalChar(prev => ({ ...prev, attacks: [...prev.attacks, newAttack] }));
      }
    } catch (err: any) { if (err.message !== 'Unauthorized') console.error(err); }
  };

  const submitSpell = async (spellData: any) => {
    try {
      const res = await fetchWithAuth(`http://localhost:8000/characters/${localChar.id}/spells`, {
        method: 'POST', body: JSON.stringify(spellData),
      });
      if (res.ok) {
        const newSpell = await res.json();
        setLocalChar(prev => ({ ...prev, spells: [...prev.spells, newSpell] }));
      }
    } catch (err: any) { if (err.message !== 'Unauthorized') console.error(err); }
  };

  const deleteItem = async (type: 'attacks' | 'spells', id: number) => {
    if (!window.confirm('Точно удалить?')) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/characters/${localChar.id}/${type}/${id}`, { method: 'DELETE' });
      if (res.ok) setLocalChar(prev => ({ ...prev, [type]: (prev[type] as any[]).filter((item: any) => item.id !== id) }));
    } catch (err: any) { if (err.message !== 'Unauthorized') alert('Ошибка удаления'); }
  };

  const updateSpellSlot = (level: number, total: number, used: number) => {
    updateField('spell_slots', { ...localChar.spell_slots, [level]: { total, used } });
  };

  const handleCastSpell = async (spellId: number, castLevel: number) => {
    setIsRolling(true);
    try {
      const url = `http://localhost:8000/characters/${localChar.id}/spells/${spellId}/cast?cast_level=${castLevel}`;
      const response = await fetchWithAuth(url, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) { alert(data.detail || 'Ошибка каста'); return; }

      setRollResult(data);

      if (castLevel > 0) {
        setLocalChar(prev => {
          const currentSlots = prev.spell_slots[castLevel] || { total: 0, used: 0 };
          return { ...prev, spell_slots: { ...prev.spell_slots, [castLevel]: { ...currentSlots, used: currentSlots.used + 1 } } };
        });
      }
    } catch (err: any) {
      if (err.message !== 'Unauthorized') alert('Не удалось скастовать заклинание :(');
    } finally { setIsRolling(false); }
  };

  const handleLongRest = async () => {
    if (!window.confirm('Совершить продолжительный отдых? Вы восстановите все ХП и ячейки заклинаний.')) return;
    const updatedSlots = { ...localChar.spell_slots };
    for (const level in updatedSlots) updatedSlots[level] = { ...updatedSlots[level], used: 0 };

    setLocalChar(prev => ({ ...prev, current_hp: prev.max_hp, spell_slots: updatedSlots }));

    try {
      await fetchWithAuth(`http://localhost:8000/characters/${localChar.id}`, {
        method: 'PATCH', body: JSON.stringify({ current_hp: localChar.max_hp, spell_slots: updatedSlots }),
      });
    } catch (err: any) { if (err.message !== 'Unauthorized') console.error('Ошибка сохранения отдыха'); }
  };

  const handleShortRest = () => {
    const input = window.prompt('Сколько ХП вы восстановили за короткий отдых? (Используйте кости хитов)');
    if (input !== null) {
      const amount = parseInt(input, 10);
      if (!isNaN(amount) && amount > 0) updateHP(amount);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 animate-fade-in pb-10 font-sans relative">
      <CharacterHeader 
        character={localChar} 
        onBack={onBack} 
        profBonus={profBonus} 
        onLongRest={handleLongRest} 
        onShortRest={handleShortRest} 
        onUpdateLevel={(newLevel) => updateField('level', newLevel)}
      />

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
        {activeTab === 'stats' && <StatsTab character={localChar} profBonus={profBonus} onToggleSkill={toggleSkill} onToggleSave={toggleSavingThrow} onUpdateStat={(statId, value) => updateField(statId, Math.max(1, Math.min(30, value)))} onRoll={handleRoll} />}
        {activeTab === 'combat' && (
          <CombatTab 
            character={localChar} 
            isRolling={isRolling} 
            onUpdateHp={updateHP} 
            onUpdateAC={(newAC) => updateField('armor_class', newAC)}
            onRoll={handleRoll} 
            onAddAttack={() => setShowAttackModal(true)} 
            onDeleteAttack={(id) => deleteItem('attacks', id)} 
          />
        )}
        {activeTab === 'spells' && <SpellsTab character={localChar} isRolling={isRolling} onAddSpell={() => setShowSpellModal(true)} onDeleteSpell={(id) => deleteItem('spells', id)} onCast={handleCastSpell} onUpdateSlots={updateSpellSlot} />}
        {activeTab === 'features' && <FeaturesTab character={localChar} />}
      </div>

      {/* Вынесенные модальные окна! */}
      <RollModal result={rollResult} onClose={() => setRollResult(null)} />
      {showAttackModal && <AttackModal onClose={() => setShowAttackModal(false)} onSubmit={submitAttack} />}
      {showSpellModal && <SpellModal onClose={() => setShowSpellModal(false)} onSubmit={submitSpell} />}
    </div>
  );
}