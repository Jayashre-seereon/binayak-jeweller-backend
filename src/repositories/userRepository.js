import prisma from "../config/db.js";

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};


export const createUser = (data) => {
  return prisma.user.create({
    data,
  });
};


export const updateUser = (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};