const buildSuffix = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${timePart}${randomPart}`;
};

export const generateProductCode = async (name, category, metal) => {
  const cat = category?.slice(0, 3).toUpperCase() || "CAT";
  const met = metal?.slice(0, 3).toUpperCase() || "MET";

  return `PRD-${cat}-${met}-${buildSuffix()}`;
};
