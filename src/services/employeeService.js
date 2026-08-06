import prisma from "../config/db.js";

import {
  createEmployeeRepo,
  getEmployeesByStore,
  getEmployeeByIdRepo,
  updateEmployeeRepo,
  deleteEmployeeRepo,
  countEmployees,
} from "../repositories/employeeRepository.js";

import { generateEmployeeCode } from "../utils/employeeCode.js";

// Create Employee
export const createEmployee = async (data, storeId) => {
  // Check duplicate email
  const existingEmployee = await prisma.employee.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingEmployee) {
    throw new Error("Email already exists");
  }

  // Generate Employee Code
  const count = await countEmployees();

  const empCode = await generateEmployeeCode(count);

  // Save Employee
  return await createEmployeeRepo({
    empCode,
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    salary: Number(data.salary),
    storeId: Number(storeId),
  });
};

// Get All Employees
export const getEmployees = async (storeId) => {
  return await getEmployeesByStore(Number(storeId));
};

// Get Employee By Id
export const getEmployeeById = async (id, storeId) => {
  const employee = await getEmployeeByIdRepo(Number(id));

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (employee.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  return employee;
};

// Update Employee
export const updateEmployee = async (id, data, storeId) => {
  const employee = await getEmployeeByIdRepo(Number(id));

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (employee.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  // Check duplicate email
  if (data.email && data.email !== employee.email) {
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingEmployee) {
      throw new Error("Email already exists");
    }
  }

  return await updateEmployeeRepo(Number(id), {
    ...(data.name && { name: data.name }),
    ...(data.mobile && { mobile: data.mobile }),
    ...(data.email && { email: data.email }),
    ...(data.salary && { salary: Number(data.salary) }),
  });
};

// Delete Employee
export const deleteEmployee = async (id, storeId) => {
  const employee = await getEmployeeByIdRepo(Number(id));

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (employee.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }
try {
    return await deleteEmployeeRepo(Number(id));
  } catch (error) {
    throw new Error(handleDeleteError(error, "employee"));
  }
};