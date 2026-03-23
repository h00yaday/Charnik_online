
import { useState, useEffect } from 'react';
import type { Character } from './types/character';

import Auth from './features/auth/Auth';
import Tavern from './features/tavern/Tavern';
import CharacterSheet from './features/character-sheet/CharacterSheet';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setActiveCharacter(null);
  };

  const handleDeleteCharacter = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите НАВСЕГДА удалить этого персонажа?')) return;
    try {
      const res = await fetch(`http://localhost:8000/characters/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); throw new Error('Время сессии истекло'); }
      if (res.ok) setCharacters(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      if (!err.message.includes('сессии')) alert('Не удалось удалить персонажа');
    }
  };

  // РОУТИНГ (Что показываем пользователю)
  if (!token) {
    return <Auth onLogin={setToken} />;
  }

  if (activeCharacter) {
    return (
      <CharacterSheet 
        character={activeCharacter} 
        token={token} 
        onBack={() => setActiveCharacter(null)} 
      />
    );
  }

  return (
    <Tavern 
      characters={characters}
      loading={loading}
      token={token}
      onSelectCharacter={setActiveCharacter}
      onDeleteCharacter={handleDeleteCharacter}
      onLogout={handleLogout}
      onRefresh={fetchCharacters}
    />
  );
}