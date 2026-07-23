import prisma from "../config/db.js";
const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData,
  });
};

const getUsers = async () => {
  return await prisma.user.findMany();
};

const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

const updateUser = async (id, userData) => {
  return await prisma.user.update({
    where: { id },
    data: userData,
  });
};

const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id },
  });
};

export default {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};