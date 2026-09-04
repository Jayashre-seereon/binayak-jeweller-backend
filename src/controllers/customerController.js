import {
  lookupCustomerByPhoneService,
  getOrCreateCustomerService,
} from "../services/customerService.js";
import prisma from "../config/db.js";

export const lookupCustomer = async (req, res) => {
  try {
    const { phone } = req.query;
    const rawStoreId = Array.isArray(req.query.storeId)
      ? req.query.storeId[0]
      : req.query.storeId;
    const storeId = Number(rawStoreId || req.user?.storeId || 1) || 1;

    const result = await lookupCustomerByPhoneService(phone, storeId);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Lookup Customer Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to lookup customer.",
    });
  }
};

export const getCustomerHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const rawStoreId = Array.isArray(req.query.storeId)
      ? req.query.storeId[0]
      : req.query.storeId;
    const storeId = Number(rawStoreId || req.user?.storeId || 1) || 1;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    const result = await lookupCustomerByPhoneService(customer.phone, storeId);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get Customer History Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get customer history.",
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId || req.user?.storeId || 1);
    const search = req.query.search?.trim();

    const where = {
      storeId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { customerCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { id: "desc" },
      take: 100,
    });

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to get customers.",
    });
  }
};
