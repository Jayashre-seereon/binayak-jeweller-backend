import * as employeeService from "../services/employeeService.js";

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const employee = await employeeService.createEmployee(
      req.body,
      storeId
    );

    res.status(201).json({
      success: true,
      employee,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Employees
export const getEmployees = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const employees = await employeeService.getEmployees(storeId);

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Employee By ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Employee
export const updateEmployee = async (req, res) => {
  try {
    const employee = await employeeService.updateEmployee(
      Number(req.params.id),
      req.body,
      Number(req.query.storeId)
    );

    res.status(200).json({
      success: true,
      employee,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Employee
export const deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};