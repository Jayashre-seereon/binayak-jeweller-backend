import prisma from "../config/db.js";
import {
  createSaleRepo,
  getSaleByIdRepo,
  getSalesRepo,
  getSaleCountRepo,
} from "../repositories/salesRepository.js";

import { generateSaleInvoiceNo } from "../utils/salesCodeGenerator.js";

const paymentModes = [
  "CASH",
  "ONLINE",
  "CARD",
  "UPI",
  "CHEQUE",
  "OTHER",
];

const roundMoney = (value) =>
  Math.round(Number(value || 0) * 100) / 100;

const formatMoney = (value) =>
  roundMoney(value).toFixed(2);

const saleError = (message) => new Error(message);

const validateInventory = async (tx, inventoryId, storeId) => {
  const inventory = await tx.inventory.findFirst({
    where: {
      id: Number(inventoryId),
      storeId: Number(storeId),
    },
    include: {
      item: true,
      product: true,
      metal: true,
      purityMaster: true,
      grade: true,
      stone: true,
    },
  });

  if (!inventory) {
    throw saleError(
      `Selected inventory item was not found. Please refresh the page and try again.`
    );
  }

  if (inventory.status !== "AVAILABLE") {
    throw saleError(
      `Selected inventory item ${inventory.barcodeNo || inventory.inventoryCode || inventory.id} is not available for sale. Please choose an available item.`
    );
  }

  return inventory;
};

const getAdvanceUsedAmount = async (
  tx,
  advanceReceiveId
) => {
  const result = await tx.saleAdvanceAdjustment.aggregate({
    where: {
      advanceReceiveId: Number(advanceReceiveId),
    },
    _sum: {
      amount: true,
    },
  });

  return Number(result._sum.amount || 0);
};

export const createSaleService = async (
  data,
  storeId
) => {
  const numericStoreId = Number(storeId);

  if (!numericStoreId) {
    throw saleError("Please select a store before creating a sale.");
  }

  if (
    !data.items ||
    !Array.isArray(data.items) ||
    data.items.length === 0
  ) {
    throw saleError(
      "Please add at least one inventory item to continue."
    );
  }

  const invoiceNo =
    await generateSaleInvoiceNo(numericStoreId);

  return prisma.$transaction(
    async (tx) => {
      /*
      ========================================
      1. CUSTOMER
      ========================================
      */

      let partyId = null;

      if (data.partyId) {
        const party = await tx.partymaster.findFirst({
          where: {
            id: Number(data.partyId),
            storeId: numericStoreId,
          },
        });

        if (!party) {
          throw saleError(
            "The selected customer is not linked to this store. Please choose a valid customer."
          );
        }

        partyId = Number(data.partyId);
      }

      /*
      ========================================
      2. VALIDATE INVENTORY
      ========================================
      */

      const inventoryIds = data.items.map(
        (item) => Number(item.inventoryId)
      );

      const uniqueInventoryIds =
        new Set(inventoryIds);

      if (
        uniqueInventoryIds.size !==
        inventoryIds.length
      ) {
        throw saleError(
          "The same inventory item cannot be added more than once."
        );
      }

      const inventories = [];

      for (const inventoryId of inventoryIds) {
        const inventory = await validateInventory(
          tx,
          inventoryId,
          numericStoreId
        );

        inventories.push(inventory);
      }

      /*
      ========================================
      3. CALCULATE SALE ITEMS
      ========================================
      */

      const saleItems = data.items.map(
        (item, index) => {
          const inventory = inventories[index];

          return {
            inventoryId: inventory.id,

            pieces: Number(item.pieces || 1),

            grossWeight: Number(
              item.grossWeight ??
                inventory.grossWeight ??
                0
            ),

            stoneWeight: Number(
              item.stoneWeight ??
                inventory.stoneWeight ??
                0
            ),

            netWeight: Number(
              item.netWeight ??
                inventory.netWeight ??
                0
            ),

            purity:
              item.purity !== undefined
                ? Number(item.purity)
                : inventory.purity,

            rate: Number(item.rate || 0),

            metalAmount: Number(
              item.metalAmount || 0
            ),

            makingCharges: Number(
              item.makingCharges || 0
            ),

            wastageAmount: Number(
              item.wastageAmount || 0
            ),

            stoneAmount: Number(
              item.stoneAmount || 0
            ),

            hallmarkCharges: Number(
              item.hallmarkCharges || 0
            ),

            otherAmount: Number(
              item.otherAmount || 0
            ),

            discount: Number(
              item.discount || 0
            ),

            taxableAmount: Number(
              item.taxableAmount ||
                item.totalAmount ||
                0
            ),

            igst: Number(item.igst || 0),

            cgst: Number(item.cgst || 0),

            sgst: Number(item.sgst || 0),

            taxAmount: Number(
              item.taxAmount || 0
            ),

            totalAmount: Number(
              item.totalAmount || 0
            ),
          };
        }
      );

      /*
      ========================================
      4. OLD GOLD
      ========================================
      */

      const oldGolds = [];

      let oldGoldAmount = 0;

      if (
        data.oldGold &&
        Array.isArray(data.oldGold)
      ) {
        for (const oldGold of data.oldGold) {
          const value = Number(
            oldGold.value || 0
          );

          if (value <= 0) {
            throw saleError(
              "Old gold amount must be greater than zero."
            );
          }

          oldGolds.push({
            purchaseId:
              oldGold.purchaseId
                ? Number(oldGold.purchaseId)
                : null,

            description:
              oldGold.description || null,

            grossWeight: Number(
              oldGold.grossWeight || 0
            ),

            stoneWeight: Number(
              oldGold.stoneWeight || 0
            ),

            netWeight: Number(
              oldGold.netWeight || 0
            ),

            purity:
              oldGold.purity !== undefined
                ? Number(oldGold.purity)
                : null,

            rate: Number(
              oldGold.rate || 0
            ),

            metalAmount: Number(
              oldGold.metalAmount || 0
            ),

            deductionAmount: Number(
              oldGold.deductionAmount || 0
            ),

            value,

            storeId: numericStoreId,
          });

          oldGoldAmount += value;
        }
      }

      /*
      ========================================
      5. ADVANCE
      ========================================
      */

      const advanceAdjustments = [];

      let advanceAmount = 0;

      if (
        data.advanceAdjustments &&
        Array.isArray(
          data.advanceAdjustments
        )
      ) {
        for (
          const adjustment of data.advanceAdjustments
        ) {
          const advance =
            await tx.advanceReceive.findFirst({
              where: {
                id: Number(
                  adjustment.advanceReceiveId
                ),
                storeId: numericStoreId,
              },
            });

          if (!advance) {
            throw saleError(
              "The selected advance receipt was not found for this store."
            );
          }

          const requestedAmount = Number(
            adjustment.amount || 0
          );

          if (requestedAmount <= 0) {
            throw saleError(
              "Advance adjustment amount must be greater than zero."
            );
          }

          const alreadyUsed =
            await getAdvanceUsedAmount(
              tx,
              advance.id
            );

          const available =
            Number(advance.amount) -
            alreadyUsed;

          if (
            requestedAmount >
            available
          ) {
            throw saleError(
              `Only ${formatMoney(available)} is available from the selected advance receipt. Please reduce the adjustment amount.`
            );
          }

          advanceAdjustments.push({
            advanceReceiveId: advance.id,
            amount: requestedAmount,
            storeId: numericStoreId,
          });

          advanceAmount +=
            requestedAmount;
        }
      }

      /*
      ========================================
      6. TOTALS
      ========================================
      */

      const subtotal = roundMoney(
        saleItems.reduce(
          (sum, item) => sum + Number(item.totalAmount || 0),
          0
        )
      );

      const discount = roundMoney(data.discount || 0);

      const igst = roundMoney(data.igst || 0);

      const cgst = roundMoney(data.cgst || 0);

      const sgst = roundMoney(data.sgst || 0);

      const taxAmount =
        roundMoney(data.taxAmount || 0) ||
        roundMoney(igst + cgst + sgst);

      const roundOff = roundMoney(data.roundOff || 0);

      const grossTotal = roundMoney(
        subtotal - discount + taxAmount + roundOff
      );

      const payableAmount = roundMoney(
        grossTotal - oldGoldAmount - advanceAmount
      );

      if (payableAmount < 0) {
        throw saleError(
          "Old gold and advance adjustments cannot be greater than the sale total. Please reduce the adjustment values."
        );
      }

      /*
      ========================================
      7. PAYMENT
      ========================================
      */

      const payments = [];

      let paidAmount = 0;

      if (
        data.payments &&
        Array.isArray(data.payments)
      ) {
        for (
          const payment of data.payments
        ) {
          if (
            !paymentModes.includes(
              payment.paymentMode
            )
          ) {
            throw saleError(
              `Payment mode "${payment.paymentMode}" is not supported. Please choose a valid payment method.`
            );
          }

          const amount = roundMoney(payment.amount || 0);

          if (amount <= 0) {
            throw saleError(
              "Payment amount must be greater than zero."
            );
          }

          payments.push({
            paymentMode:
              payment.paymentMode,

            amount,

            referenceNo:
              payment.referenceNo ||
              null,

            paymentDate:
              payment.paymentDate
                ? new Date(
                    payment.paymentDate
                  )
                : new Date(),

            narration:
              payment.narration ||
              null,

            storeId: numericStoreId,
          });

          paidAmount += amount;
        }
      }

      if (
        paidAmount >
        payableAmount
      ) {
        throw saleError(
          `Payment cannot exceed payable amount. Paid ${formatMoney(paidAmount)} but only ${formatMoney(payableAmount)} is payable.`
        );
      }

      const dueAmount = roundMoney(payableAmount - paidAmount);

      /*
      ========================================
      8. CREATE SALE
      ========================================
      */

      const sale = await createSaleRepo(
        {
          invoiceNo,

          storeId:
            numericStoreId,

          partyId,

          saleDate: data.saleDate
            ? new Date(data.saleDate)
            : new Date(),

          customerName:
            data.customerName || null,

          customerPhone:
            data.customerPhone || null,

          customerAddress:
            data.customerAddress ||
            null,

          customerGst:
            data.customerGst || null,

          subtotal,

          discount,

          igst,

          cgst,

          sgst,

          taxAmount,

          roundOff,

          grossTotal,

          oldGoldAmount,

          advanceAmount,

          payableAmount,

          paidAmount,

          dueAmount,

          narration:
            data.narration || null,

          items: {
            create: saleItems,
          },

          payments: {
            create: payments,
          },

          oldGolds: {
            create: oldGolds,
          },

          advanceAdjustments: {
            create:
              advanceAdjustments,
          },
        },
        tx
      );

      /*
      ========================================
      9. INVENTORY -> SOLD
      ========================================
      */

      for (const inventory of inventories) {
        await tx.inventory.update({
          where: {
            id: inventory.id,
          },

          data: {
            status: "SOLD",
          },
        });
      }

      return sale;
    },
    {
      isolationLevel:
        "Serializable",
    }
  );
};

export const getSalesService = async (
  storeId
) => {
  return getSalesRepo(Number(storeId));
};

export const getSaleByIdService = async (
  id,
  storeId
) => {
  const sale = await getSaleByIdRepo(
    Number(id),
    Number(storeId)
  );

  if (!sale) {
    throw saleError(
      "Sale record not found. It may have been removed or you may not have access to it."
    );
  }

  return sale;
};

export const getSaleCountService = async (
  storeId
) => {
  return getSaleCountRepo(
    Number(storeId)
  );
};
