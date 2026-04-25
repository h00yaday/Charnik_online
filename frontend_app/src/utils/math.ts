export function getModifier(score: number): number {
  const num = Number(score);
  if (isNaN(num)) return 0;
  return Math.floor((num - 10) / 2);
}

export function formatMod(mod?: number | null): string {
  if (mod === undefined || mod === null || isNaN(mod)) return "+0";
  return mod >= 0 ? `+${mod}` : mod.toString();
};

export function getProfBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}
export function toNum(val: string): number {
  const parsed = Number(val);
  return isNaN(parsed) ? 0 : parsed;
};

export function getInitiative(dex: number | undefined): number {
  return Math.floor((toNum(dex?.toString() || '0') - 10) / 2);
};