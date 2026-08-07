const buildSuffix = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${timePart}${randomPart}`;
};

export const generateItemCode = async (product, design) => {
  const pro = product?.slice(0, 3).toUpperCase() || "PRD";
  const des = design?.slice(0, 3).toUpperCase() || "DSN";

  return `ITM-${pro}-${des}-${buildSuffix()}`;
};
