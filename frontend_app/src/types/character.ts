export interface Attack { 
  id: number; 
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

export interface Feature { 
  id: number; 
  name: string; 
  description: string; 
  source: string; 
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
  skills: Record<string, number>; 
  saving_throws: Record<string, number>; 
  spell_slots: Record<string, { total: number; used: number }>;
  attacks: Attack[]; 
  spells: Spell[]; 
  features: Feature[];
}