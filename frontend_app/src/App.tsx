import { useState, useEffect } from 'react';
import Auth from './features/auth/Auth';
import Tavern from './features/tavern/Tavern';
import CharacterSheet from './features/character-sheet/CharacterSheet';
import type { Character } from './types/character';
import { fetchWithAuth } from './utils/api';

export default function App() {
  // Теперь мы просто храним статус авторизации
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      // Выбрасываем пользователя ТОЛЬКО если он думал, что авторизован
      if (isAuthenticated) {
        alert('Сессия истекла или недействительна. Пожалуйста, войдите снова.');
        setIsAuthenticated(false);
        setSelectedCharacter(null); // Закрываем чарник, если он был открыт
      }
    };
    // Подписываемся на событие
    window.addEventListener('unauthorized', handleUnauthorized);
    
    // Очищаем слушатель, если компонент будет удален
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [isAuthenticated]); // Зависимость гарантирует, что мы видим актуальный стейт

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/characters/');
      if (res.ok) {
        setCharacters(await res.json());
        setIsAuthenticated(true); // Раз отдали данные, значит кука работает!
      }
    } catch (err) {
      // Если тут 401, сработает наш глобальный слушатель (unauthorized)
      // Если это просто старт приложения без куки, слушатель промолчит.
      // Поэтому здесь ничего дополнительно делать не нужно.
    } finally {
      setLoading(false);
    }
  };

  // Вызываем её ровно один раз при загрузке приложения
  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleLogout = async () => {
    try {
      // Говорим серверу убить куку
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthenticated(false);
      setSelectedCharacter(null);
      setCharacters([]);
    }
  };

  const deleteCharacter = async (e: any, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите удалить этого персонажа навсегда?')) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/characters/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCharacters(prev => prev.filter(c => c.id !== id));
      }
    } catch (err: any) {
      console.error('Ошибка удаления', err);
    }
  };

  if (!isAuthenticated) {
    // Передаем коллбэк, который переключит стейт после успешного логина
    return <Auth onLogin={() => {
      setIsAuthenticated(true);
      fetchCharacters();
    }} />;
  }

  if (selectedCharacter) {
    return (
      <CharacterSheet
        character={selectedCharacter}
        onBack={() => {
          setSelectedCharacter(null);
          fetchCharacters();
        }}
      />
    );
  }

  return (
    <Tavern
      characters={characters}
      loading={loading}
      onSelectCharacter={setSelectedCharacter}
      onDeleteCharacter={deleteCharacter}
      onRefresh={fetchCharacters}
      onLogout={handleLogout}
    />
  );
}