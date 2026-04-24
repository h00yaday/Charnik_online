import type { SkillKey, StatKey } from '../types/character';

// --- КОНСТАНТЫ D&D ---
export const SKILLS = [
  { id: 'acrobatics', name: 'Акробатика', stat: 'dexterity' },
  { id: 'animal_handling', name: 'Уход за животными', stat: 'wisdom' },
  { id: 'arcana', name: 'Магия', stat: 'intelligence' },
  { id: 'athletics', name: 'Атлетика', stat: 'strength' },
  { id: 'deception', name: 'Обман', stat: 'charisma' },
  { id: 'history', name: 'История', stat: 'intelligence' },
  { id: 'insight', name: 'Проницательность', stat: 'wisdom' },
  { id: 'intimidation', name: 'Запугивание', stat: 'charisma' },
  { id: 'investigation', name: 'Анализ', stat: 'intelligence' },
  { id: 'medicine', name: 'Медицина', stat: 'wisdom' },
  { id: 'nature', name: 'Природа', stat: 'intelligence' },
  { id: 'perception', name: 'Восприятие', stat: 'wisdom' },
  { id: 'performance', name: 'Выступление', stat: 'charisma' },
  { id: 'persuasion', name: 'Убеждение', stat: 'charisma' },
  { id: 'religion', name: 'Религия', stat: 'intelligence' },
  { id: 'sleight_of_hand', name: 'Ловкость рук', stat: 'dexterity' },
  { id: 'stealth', name: 'Скрытность', stat: 'dexterity' },
  { id: 'survival', name: 'Выживание', stat: 'wisdom' },
] as const satisfies ReadonlyArray<{ id: SkillKey; name: string; stat: StatKey }>;
export const STATS = [
  { id: 'strength', name: 'Сила' },
  { id: 'dexterity', name: 'Ловкость' },
  { id: 'constitution', name: 'Телосложение' },
  { id: 'intelligence', name: 'Интеллект' },
  { id: 'wisdom', name: 'Мудрость' },
  { id: 'charisma', name: 'Харизма' }
] as const satisfies ReadonlyArray<{ id: StatKey; name: string }>;