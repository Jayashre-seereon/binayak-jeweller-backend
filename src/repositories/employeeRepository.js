import prisma from "../config/db.js";

// Create Employee
export const createEmployeeRepo = (data) => {
  return prisma.employee.create({
    data,
  });
};

// Get All Employees by Store
export const getEmployeesByStore = (storeId) => {
  return prisma.employee.findMany({
    where: {
      storeId,
    },
    include: {
      store: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

// Get Employee By ID
export const getEmployeeByIdRepo = (id) => {
  return prisma.employee.findUnique({
    where: {
      id,
    },
    include: {
      store: true,
    },
  });
};

// Update Employee
export const updateEmployeeRepo = (id, data) => {
  return prisma.employee.update({
    where: {
      id,
    },
    data,
  });
};

// Delete Employee
export const deleteEmployeeRepo = (id) => {
  return prisma.employee.delete({
    where: {
      id,
    },
  });
};

// Count Employees (For Employee Code Generation)
export const countEmployees = () => {
  return prisma.employee.count();
};