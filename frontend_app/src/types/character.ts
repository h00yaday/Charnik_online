export type StatKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export type SkillKey =
  | 'acrobatics'
  | 'animal_handling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleight_of_hand'
  | 'stealth'
  | 'survival';

export type SavingThrowMap = Partial<Record<StatKey, number>>;
export type SkillMap = Partial<Record<SkillKey, number>>;

export interface Attack { 
  id: number; 
  name: string; 
  attack_bonus: number; 
  damage_dice: string; 
  damage_type: string; 
}

export interface AttackCreatePayload {
  name: string;
  attack_bonus: number;
  damage_dice: string;
  damage_type: string;
}

export interface Spell { 
  id: number; 
  name: string; 
  level: number; 
  description: string; 
  damage_dice?: string; 
  damage_type?: string; 
  requires_attack_roll?: boolean;
  spell_attack_bonus?: number;
}

export interface SpellCreatePayload {
  name: string;
  level: number;
  description: string;
  damage_dice?: string | null;
  damage_type?: string | null;
  requires_attack_roll: boolean;
  spell_attack_bonus: number;
}

export interface Feature { 
  id: number; 
  name: string; 
  description: string; 
  source: string; 
  modifiers?: Partial<Record<StatKey | 'armor_class' | 'speed' | 'max_hp' | 'initiative_bonus', number>>;
}

export interface FeatureCreatePayload {
  name: string;
  description: string;
  source: string;
  modifiers: Partial<Record<StatKey | 'armor_class' | 'speed' | 'max_hp' | 'initiative_bonus', number>>;
}

export interface RollResult {
  action: string;
  hit_roll?: {
    d20_face: number;
    bonus: number;
    total: number;
    is_critical: boolean;
    is_critical_fail: boolean;
  };
  damage?: {
    total: number;
    modifier: number;
    type: string;
  };
  effect?: string;
  spell_slots_remaining?: number | string;
}

export interface Character {
  id: number; 
  name: string; 
  level: number;
  race: string; 
  character_class: string; 
  subclass?: string; 
  background?: string;
  max_hp: number; 
  current_hp: number; 
  armor_class: number; 
  speed: number; 
  initiative_bonus: number;
  strength: number; 
  dexterity: number; 
  constitution: number; 
  intelligence: number; 
  wisdom: number; 
  charisma: number;
  skills: SkillMap;
  saving_throws: SavingThrowMap;
  spell_slots: Record<string, { total: number; used: number }>;
  attacks: Attack[]; 
  spells: Spell[]; 
  features: Feature[];
}