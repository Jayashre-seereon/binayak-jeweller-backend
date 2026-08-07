export const generateProductCode = async (name, category, metal, existingCodes = []) => {
  const cat = category?.slice(0, 3).toUpperCase() || "CAT";
  const met = metal?.slice(0, 3).toUpperCase() || "MET";
  const nextNumber = existingCodes.reduce((max, code) => {
    const match = String(code || "").match(/-(\d+)$/);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0) + 1;

  return `PRD-${cat}-${met}-${String(nextNumber).padStart(4, "0")}`;
};
