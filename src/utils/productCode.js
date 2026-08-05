export const generateProductCode = async (name, category, metal, count) => {
  const cat = category?.slice(0, 3).toUpperCase() || "CAT";
  const met = metal?.slice(0, 3).toUpperCase() || "MET";

  const number = String(count + 1).padStart(4, "0");

  return `PRD-${cat}-${met}-${number}`;
};