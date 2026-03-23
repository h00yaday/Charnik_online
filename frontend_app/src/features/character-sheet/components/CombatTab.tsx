import type { Character } from '../../../types/character';
import { formatMod } from '../../../utils/math';

interface Props {
  character: Character;
  isRolling: boolean;
  onUpdateHp: (amount: number) => void;
  onRoll: (url: string) => void;
  onAddAttack: () => void;
  onDeleteAttack: (id: number) => void;
}

export default function CombatTab({ character, isRolling, onUpdateHp, onRoll, onAddAttack, onDeleteAttack }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
         <div className="absolute top-0 w-full h-2 bg-slate-900"><div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(character.current_hp / character.max_hp) * 100}%` }}></div></div>
         <h3 className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-sm">Хитпоинты</h3>
         <div className="flex items-center gap-6">
           <button onClick={() => onUpdateHp(-1)} className="w-12 h-12 rounded-full bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white font-black text-xl transition-colors">-</button>
           <div className="text-center">
             <span className="text-6xl font-black text-slate-100">{character.current_hp}</span>
             <span className="text-xl text-slate-500 font-bold"> / {character.max_hp}</span>
           </div>
           <button onClick={() => onUpdateHp(1)} className="w-12 h-12 rounded-full bg-emerald-900/30 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-xl transition-colors">+</button>
         </div>
      </div>
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex items-center justify-center gap-8 shadow-xl">
         <div className="text-center">
            <span className="text-sm text-slate-400 font-bold block mb-2 uppercase tracking-widest">Класс Доспеха</span>
            <div className="w-24 h-28 mx-auto bg-slate-900 border-2 border-slate-600 rounded-t-full rounded-b-xl flex items-center justify-center relative"><span className="text-4xl font-black text-blue-400">{character.armor_class}</span></div>
         </div>
      </div>
      <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
          <h3 className="text-2xl font-black text-slate-200">Оружие и Атаки</h3>
          <button onClick={onAddAttack} className="text-amber-400 hover:text-amber-300 font-bold text-sm">+ Добавить атаку</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {character.attacks.map(attack => (
            <div key={attack.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center group hover:border-orange-500/50 transition-colors">
               <div>
                  <div className="flex items-center gap-2"><h4 className="font-bold text-lg text-slate-200">{attack.name}</h4><button onClick={() => onDeleteAttack(attack.id)} className="text-xs text-slate-600 hover:text-red-500 transition-colors">✕</button></div>
                  <div className="flex gap-3 mt-1 text-sm font-mono"><span className="text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">Попадание: {formatMod(attack.attack_bonus)}</span><span className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/50">Урон: {attack.damage_dice} {attack.damage_type}</span></div>
               </div>
               <button onClick={() => onRoll(`http://localhost:8000/characters/${character.id}/attacks/${attack.id}/roll`)} disabled={isRolling} className="h-12 w-24 bg-orange-600/20 text-orange-500 border border-orange-500/30 rounded-lg hover:bg-orange-600 hover:text-white font-black uppercase text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50">БИТЬ</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}