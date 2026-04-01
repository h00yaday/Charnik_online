import { useState } from 'react';
import { fetchWithAuth } from '../../../utils/api';

interface CharacterFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CharacterForm({ onCancel, onSuccess }: CharacterFormProps) {
  const [form, setForm] = useState({
    name: '',
    race: 'Человек',
    character_class: 'Воин',
    background: '',
    level: 1,
    max_hp: 10,
    armor_class: 10,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetchWithAuth('/characters/', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Ошибка создания персонажа');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message !== 'Unauthorized') {
        alert('Не удалось подключиться к серверу');
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { key: 'strength', label: 'СИЛ' }, { key: 'dexterity', label: 'ЛОВ' },
    { key: 'constitution', label: 'ТЕЛ' }, { key: 'intelligence', label: 'ИНТ' },
    { key: 'wisdom', label: 'МУД' }, { key: 'charisma', label: 'ХАР' }
  ];

  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 mb-10 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-200 tracking-wider uppercase">Новый Герой</h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-red-400 font-bold transition-colors">✕ Закрыть</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Блок основной информации */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Имя персонажа</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Гэндальф" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Раса</label>
            <input type="text" required value={form.race} onChange={e => setForm({...form, race: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Эльф" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Класс</label>
            <input type="text" required value={form.character_class} onChange={e => setForm({...form, character_class: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Волшебник" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Предыстория</label>
            <input type="text" value={form.background} onChange={e => setForm({...form, background: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors" placeholder="Мудрец (опционально)" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Уровень</label>
            <input type="number" min="1" max="20" required value={form.level} onChange={e => setForm({...form, level: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-amber-500 transition-colors text-center" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Макс ХП</label>
              <input type="number" required value={form.max_hp} onChange={e => setForm({...form, max_hp: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-bold outline-none focus:border-emerald-500 transition-colors text-center" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">КД (Броня)</label>
              <input type="number" required value={form.armor_class} onChange={e => setForm({...form, armor_class: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-blue-400 font-bold outline-none focus:border-blue-500 transition-colors text-center" />
            </div>
          </div>
        </div>

        {/* Блок характеристик */}
        <div className="pt-4 border-t border-slate-700">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Базовые характеристики (Значения 1-20)</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {stats.map(stat => (
              <div key={stat.key} className="bg-slate-900 p-2 rounded-lg border border-slate-700/50">
                <label className="block text-[10px] text-center text-slate-500 font-bold mb-1">{stat.label}</label>
                <input 
                  type="number" min="1" max="30" required 
                  value={(form as any)[stat.key]} 
                  onChange={e => setForm({...form, [stat.key]: Number(e.target.value)})} 
                  className="w-full bg-transparent text-center text-xl font-bold text-amber-400 outline-none" 
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-lg transition-colors shadow-lg shadow-amber-900/20 disabled:opacity-50 uppercase tracking-wider">
            {loading ? 'Вписываем в реестр...' : 'Создать персонажа'}
          </button>
        </div>
      </form>
    </div>
  );
}