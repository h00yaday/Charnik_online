export const getModifier = (score: number) => Math.floor((score - 10) / 2);

export const formatMod = (mod?: number | null) => {
  if (mod === undefined || mod === null || isNaN(mod)) return "+0";
  return mod >= 0 ? `+${mod}` : mod.toString();
};

export const getProfBonus = (level: number) => Math.ceil(level / 4) + 1;