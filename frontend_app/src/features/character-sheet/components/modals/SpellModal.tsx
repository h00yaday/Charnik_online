import { useState } from 'react';

interface Props { onClose: () => void; onSubmit: (data: any) => Promise<void>; }

export default function SpellModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState({ name: '', level: 0, description: '', damage_dice: '', damage_type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    await onSubmit(form);
    setIsSubmitting(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-xl font-black text-indigo-400 mb-6 uppercase tracking-wider">Изучить Заклинание</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Название</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="Огненный шар" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Уровень</label>
              <input type="number" min="0" max="9" required value={form.level} onChange={e => setForm({...form, level: Number(e.target.value)})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500 text-center" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Урон (Опционально)</label>
              <input type="text" pattern="^[0-9dD+\-\s]+$" value={form.damage_dice} onChange={e => setForm({...form, damage_dice: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-red-500 text-center" placeholder="8d6" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Тип урона</label>
              <input type="text" value={form.damage_type} onChange={e => setForm({...form, damage_type: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500" placeholder="Огонь" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1">Описание</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 outline-none focus:border-indigo-500 resize-none" placeholder="Сфера огня взрывается..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Отмена</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50">Изучить</button>
          </div>
        </form>
      </div>
    </div>
  );
}