import type { Character } from '../../../types/character';

interface Props {
  character: Character;
  isRolling: boolean;
  onAddSpell: () => void;
  onDeleteSpell: (id: number) => void;
  onRoll: (url: string) => void;
}

export default function SpellsTab({ character, isRolling, onAddSpell, onDeleteSpell, onRoll }: Props) {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <div className="flex justify-between items-end mb-6 border-b border-slate-700 pb-2">
        <h3 className="text-2xl font-black text-slate-200">Книга заклинаний</h3>
        <button onClick={onAddSpell} className="text-indigo-400 hover:text-indigo-300 font-bold text-sm">+ Добавить заклинание</button>
      </div>
      {character.spells.length === 0 ? (
        <p className="text-slate-500 italic text-center py-6">Вы не знаете ни одного заклинания.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {character.spells.map(spell => (
            <div key={spell.id} className="bg-slate-900 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-indigo-400 text-lg">{spell.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded font-bold">Ур. {spell.level}</span>
                    <button onClick={() => onDeleteSpell(spell.id)} className="text-slate-500 hover:text-red-400">✕</button>
                  </div>
                </div>
                {spell.damage_dice && <p className="text-xs text-red-400 font-mono mb-2 bg-red-900/10 inline-block px-2 py-1 rounded">Урон: {spell.damage_dice} {spell.damage_type}</p>}
                {spell.description && <p className="text-xs text-slate-400 mt-1 line-clamp-3 mb-4">{spell.description}</p>}
              </div>
              {spell.damage_dice && <button onClick={() => onRoll(`http://localhost:8000/characters/${character.id}/spells/${spell.id}/roll`)} disabled={isRolling} className="w-full mt-auto py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-sm font-bold uppercase tracking-wider">Кастовать</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}