import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import CharacterForm from './components/CharacterForm';
import CharacterSheet from './components/CharacterSheet';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCharacter, setActiveCharacter] = useState<any | null>(null);

  const fetchCharacters = () => {
    if (!token) return;
    setLoading(true);
    fetch('http://localhost:8000/characters/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { handleLogout(); throw new Error('Токен истек'); }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCharacters(data);
        setLoading(false);
      })
      .catch(err => { console.error("Ошибка:", err); setLoading(false); });
  };

  useEffect(() => { fetchCharacters(); }, [token]);

  // Универсальная функция выхода
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setActiveCharacter(null);
    setShowForm(false);
  };

  // ФУНКЦИЯ УДАЛЕНИЯ ПЕРСОНАЖА
  const handleDeleteCharacter = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Чтобы клик по корзине не открывал карточку персонажа
    if (!window.confirm('Вы уверены, что хотите НАВСЕГДА удалить этого персонажа? Эту страницу из книги не восстановить.')) return;
    
    try {
      const res = await fetch(`http://localhost:8000/characters/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        handleLogout();
        throw new Error('Время сессии истекло');
      }
      
      if (!res.ok) throw new Error('Ошибка удаления');
      setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      if (!err.message.includes('сессии')) {
        alert('Не удалось удалить персонажа');
      }
    }
  };

  // ЭКРАН ВХОДА
  if (!token) return <Auth onLogin={setToken} />;

  // ЭКРАН ЧАРНИКА (ПЕРСОНАЖА)
  if (activeCharacter) {
    return (
      <CharacterSheet 
        character={activeCharacter} 
        token={token} 
        onBack={() => setActiveCharacter(null)} 
        onLogout={handleLogout} 
      />
    );
  }

  // ГЛАВНЫЙ ЭКРАН (ТАВЕРНА)
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200 font-sans">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400 tracking-wider uppercase">
            Таверна "У Эсмеральды"
          </h1>
          <p className="mt-2 text-slate-400 font-medium">Выберите героя или создайте нового</p>
        </div>
        
        <div className="flex space-x-3">
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-bold text-white shadow-lg shadow-amber-900/20 transition-all uppercase tracking-wider">
            + Новый герой
          </button>
          <button onClick={handleLogout} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-bold transition-colors">
            Выйти
          </button>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto">
        {/* Форма создания персонажа */}
        {showForm && (
          <CharacterForm 
            token={token} 
            onCancel={() => setShowForm(false)} 
            onSuccess={() => { setShowForm(false); fetchCharacters(); }} 
            onLogout={handleLogout}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Листаем реестр...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map(char => (
              <div 
                key={char.id} 
                onClick={() => setActiveCharacter(char)}
                className="group relative p-6 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 hover:border-amber-500/50 hover:shadow-amber-900/10 cursor-pointer transition-all transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Декоративная полоска */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 group-hover:bg-amber-500 transition-colors"></div>
                
                {/* Кнопка удаления */}
                <button 
                  onClick={(e) => handleDeleteCharacter(e, char.id)}
                  className="absolute top-4 right-4 text-slate-600 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors z-10 opacity-0 group-hover:opacity-100"
                  title="Удалить персонажа"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="flex justify-between items-start mb-4 pr-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-200 group-hover:text-amber-400 transition-colors">{char.name}</h2>
                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">
                      Ур. {char.level} | {char.race} {char.character_class}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">КД</span>
                    <span className="text-xl font-mono font-bold text-blue-400">{char.armor_class}</span>
                  </div>
                  <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 text-center">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase">Скорость</span>
                    <span className="text-xl font-mono font-bold text-slate-300">{char.speed}</span>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Здоровье</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">
                      {char.current_hp} <span className="text-slate-600 font-normal">/ {char.max_hp}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${(char.current_hp / char.max_hp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Заглушка, если нет персонажей */}
            {characters.length === 0 && !showForm && (
              <div className="col-span-full flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 bg-slate-900/50">
                <span className="text-4xl mb-4">📜</span>
                <p className="font-bold uppercase tracking-wider">В таверне пока пусто.</p>
                <button onClick={() => setShowForm(true)} className="mt-4 text-amber-500 hover:text-amber-400 font-bold border-b border-amber-500 hover:border-amber-400 pb-0.5 transition-colors">Создать первого персонажа</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}