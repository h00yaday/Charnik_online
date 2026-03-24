import { useState, useEffect } from 'react';
import Auth from './features/auth/Auth';
import Tavern from './features/tavern/Tavern';
import CharacterSheet from './features/character-sheet/CharacterSheet';
import type { Character } from './types/character';
import { fetchWithAuth } from './utils/api';

// Утилита для чтения внутренностей JWT токена
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [token, setToken] = useState<string>(localStorage.getItem('token') || '');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setSelectedCharacter(null);
    setCharacters([]);
  };

  // Глобальный "Будильник" для токена
  useEffect(() => {
    if (!token) return;

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return;

    const timeLeft = (decodedToken.exp * 1000) - Date.now();

    if (timeLeft <= 0) {
      alert('Время вашей сессии истекло. Пожалуйста, войдите снова.');
      handleLogout();
    } else {
      const timer = setTimeout(() => {
        alert('Время вашей сессии истекло. Пожалуйста, войдите снова.');
        handleLogout();
      }, timeLeft);

      return () => clearTimeout(timer);
    }
  }, [token]);

  // Загрузка списка персонажей
  const fetchCharacters = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/characters/');
      if (res.ok) {
        setCharacters(await res.json());
      }
    } catch (err: any) {
      if (err.message !== 'Unauthorized') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем персонажей при входе
  useEffect(() => {
    if (token) fetchCharacters();
  }, [token]);

  // Удаление персонажа с правильными аргументами (event и id)
  const deleteCharacter = async (e: any, id: number) => {
    e.stopPropagation(); // Не даем "кликнуть" по карточке и открыть персонажа
    if (!window.confirm('Вы уверены, что хотите удалить этого персонажа навсегда?')) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/characters/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCharacters(prev => prev.filter(c => c.id !== id));
      }
    } catch (err: any) {
      if (err.message !== 'Unauthorized') console.error('Ошибка удаления', err);
    }
  };

  // --- РЕНДЕР ---

  if (!token) {
    return <Auth onLogin={setToken} />;
  }

  // Если персонаж выбран -> показываем Чарник
  if (selectedCharacter) {
    return (
      <CharacterSheet
        character={selectedCharacter}
        onBack={() => {
          setSelectedCharacter(null);
          fetchCharacters(); // Обновляем список при возвращении в Таверну
        }}
      />
    );
  }

  // Иначе -> показываем Таверну
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