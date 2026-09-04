export const handleDeleteError = (error, entity = "record") => {
  console.log("Prisma Error 👉", error);

  if (error.code === "P2003") {
    return `Cannot delete this ${entity} because it is linked with other data.`;
  }

  if (error.code === "P2025") {
    return `${entity} not found or already deleted.`;
  }

  return `Failed to delete ${entity}`;
};