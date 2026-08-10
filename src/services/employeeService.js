import prisma from "../config/db.js";
import {
  createEmployeeRepo,
  getEmployeesByStore,
  getEmployeeByIdRepo,
  updateEmployeeRepo,
  deleteEmployeeRepo,
} from "../repositories/employeeRepository.js";
import { generateEmployeeCode } from "../utils/employeeCode.js";
import { handleDeleteError } from "../utils/errorHandler.js";

// Create Employee
export const createEmployee = async (data, storeId) => {
  if (!storeId) throw new Error("StoreId is required");

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      email: data.email,
      storeId: Number(storeId),
    },
  });

  if (existingEmployee) {
    throw new Error("Email already exists");
  }

  const empCode = await generateEmployeeCode();

  return await createEmployeeRepo({
    empCode,
    name: data.name,
    fatherName: data.fatherName || null,
    dateOfJoining: data.dateOfJoining
      ? new Date(data.dateOfJoining)
      : null,

    phone: data.phone || null,
    mobile: data.mobile,
    email: data.email,

    webAddress: data.webAddress || null,

    bankAccountNo: data.bankAccountNo || null,
    bankName: data.bankName || null,

    basicSalary:
      data.basicSalary !== undefined
        ? Number(data.basicSalary)
        : null,

    specialAllowance:
      data.specialAllowance !== undefined
        ? Number(data.specialAllowance)
        : null,

    addressLine1: data.addressLine1 || null,
    addressLine2: data.addressLine2 || null,

    storeId: Number(storeId),
  });
};

// Get All Employees
export const getEmployees = async (storeId) => {
  if (!storeId) throw new Error("StoreId is required");
  return await getEmployeesByStore(Number(storeId));
};

// Get Employee By Id
export const getEmployeeById = async (id, storeId) => {
  const employee = await getEmployeeByIdRepo(Number(id));

  if (!employee) throw new Error("Employee not found");

  if (employee.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  return employee;
};

// Update Employee
export const updateEmployee = async (id, data, storeId) => {
  const employee = await getEmployeeByIdRepo(Number(id));

  if (!employee) throw new Error("Employee not found");

  if (employee.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  // Email check
  if (data.email && data.email !== employee.email) {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        email: data.email,
        storeId: Number(storeId),
      },
    });

    if (existingEmployee) {
      throw new Error("Email already exists");
    }
  }

  return await updateEmployeeRepo(Number(id), {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.fatherName !== undefined && {
      fatherName: data.fatherName,
    }),
    ...(data.dateOfJoining !== undefined && {
      dateOfJoining: new Date(data.dateOfJoining),
    }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.mobile !== undefined && { mobile: data.mobile }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.webAddress !== undefined && {
      webAddress: data.webAddress,
    }),
    ...(data.bankAccountNo !== undefined && {
      bankAccountNo: data.bankAccountNo,
    }),
    ...(data.bankName !== undefined && {
      bankName: data.bankName,
    }),
    ...(data.basicSalary !== undefined && {
      basicSalary: Number(data.basicSalary),
    }),
    ...(data.specialAllowance !== undefined && {
      specialAllowance: Number(data.specialAllowance),
    }),
    ...(data.addressLine1 !== undefined && {
      addressLine1: data.addressLine1,
    }),
    ...(data.addressLine2 !== undefined && {
      addressLine2: data.addressLine2,
    }),
  });
};

// Delete Employee
export const deleteEmployee = async (id, storeId) => {
  const employee = await getEmployeeByIdRepo(Number(id));

  if (!employee) throw new Error("Employee not found");

  if (employee.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  try {
    return await deleteEmployeeRepo(Number(id));
  } catch (error) {
    throw new Error(handleDeleteError(error, "employee"));
  }
};