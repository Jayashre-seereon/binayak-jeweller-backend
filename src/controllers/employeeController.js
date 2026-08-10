import * as employeeService from "../services/employeeService.js";

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    const data = req.body;

    if (!storeId) throw new Error("StoreId is required");

    // Required fields
    if (!data.name) throw new Error("Employee Name is required");
    if (!data.mobile) throw new Error("Mobile is required");
    if (!data.email) throw new Error("Email is required");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error("Invalid email format");
    }

    // Mobile validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(data.mobile)) {
      throw new Error("Mobile must be 10 digits");
    }

    // Salary validation
    if (
      data.basicSalary !== undefined &&
      isNaN(Number(data.basicSalary))
    ) {
      throw new Error("Basic Salary must be a valid number");
    }

    if (
      data.specialAllowance !== undefined &&
      isNaN(Number(data.specialAllowance))
    ) {
      throw new Error("Special Allowance must be a valid number");
    }

    // Date validation
    if (
      data.dateOfJoining &&
      isNaN(Date.parse(data.dateOfJoining))
    ) {
      throw new Error("Invalid Date of Joining");
    }

    const employee = await employeeService.createEmployee(
      data,
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