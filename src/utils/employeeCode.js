export const generateEmployeeCode = async (count) => {
  const number = String(count + 1).padStart(4, "0");

  return `EMP-${number}`;
};