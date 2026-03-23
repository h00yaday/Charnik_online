import type { Character } from '../../../types/character';

interface Props { character: Character; }

export default function FeaturesTab({ character }: Props) {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <h3 className="text-2xl font-black text-slate-200 border-b border-slate-700 pb-2 mb-6">Особенности и Черты</h3>
      {character.features.length === 0 ? (
        <p className="text-slate-500 italic text-center py-6">У вас пока нет особенностей.</p>
      ) : (
        <div className="space-y-4">
          {character.features.map(f => (
            <div key={f.id} className="bg-slate-900 rounded-xl p-5 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1 block">{f.source}</span>
              <h4 className="font-bold text-xl text-slate-200 mb-2">{f.name}</h4>
              <p className="text-slate-400 text-sm whitespace-pre-wrap">{f.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}