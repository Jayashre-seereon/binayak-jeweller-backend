export const generateItemCode = async (product, design, count) => {
  const pro = product?.slice(0, 3).toUpperCase() || "PRD";
  const des = design?.slice(0, 3).toUpperCase() || "DSN";

  const number = String(count + 1).padStart(4, "0");

  return `ITM-${pro}-${des}-${number}`;
};