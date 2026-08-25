import prisma from "../config/db.js";
import {
  createSaleRepo,
  getSaleByIdRepo,
  getSalesRepo,
  getSaleCountRepo,
} from "../repositories/salesRepository.js";
import { getOrCreateCustomerService } from "./customerService.js";
import { createCustomerAdjustmentLogRepo } from "../repositories/customerRepository.js";
import { generateSaleInvoiceNo } from "../utils/salesCodeGenerator.js";
import { numberToWordsIndian } from "../utils/numberToWords.js";

const paymentModes = [
  "CASH",
  "ONLINE",
  "CARD",
  "UPI",
  "CHEQUE",
  "OTHER",
];

const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

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
      "Selected inventory item was not found. Please refresh the page and try again."
    );
  }

  if (inventory.status !== "AVAILABLE") {
    const code = inventory.barcodeNo || inventory.tagNo || inventory.inventoryCode || inventory.id;
    throw saleError(
      `Inventory item "${code}" is already ${inventory.status.toLowerCase()} and cannot be sold.`
    );
  }

  return inventory;
};

export const createSaleService = async (data, storeId, user = null) => {
  const numericStoreId = Number(storeId);

  if (!numericStoreId) {
    throw saleError("Please select a store before creating a sale.");
  }

  if (
    !data.items ||
    !Array.isArray(data.items) ||
    data.items.length === 0
  ) {
    throw saleError("Please add at least one jewellery item to create a sale.");
  }

  const store = await prisma.store.findUnique({
    where: { id: numericStoreId },
  });

  if (!store) {
    throw saleError("Store not found.");
  }

  const invoiceNo = await generateSaleInvoiceNo(numericStoreId);

  return prisma.$transaction(
    async (tx) => {
      /*
      ========================================
      1. CUSTOMER & STORE DETAILS
      ========================================
      */
      let partyId = null;
      let customerName = data.customerName?.trim() || "";
      let customerPhone = data.customerPhone?.trim() || "";
      let customerAddress = data.customerAddress?.trim() || "";
      let customerCity = data.customerCity?.trim() || "";
      let customerPan = data.customerPan?.trim() || "";
      let customerGst = data.customerGst?.trim() || "";
      let customerState = data.customerState?.trim() || "";

      if (data.partyId) {
        const party = await tx.partymaster.findFirst({
          where: {
            id: Number(data.partyId),
            storeId: numericStoreId,
          },
        });

        if (!party) {
          throw saleError(
            "The selected party is not linked to this store. Please choose a valid party."
          );
        }

        partyId = Number(data.partyId);
        customerName = customerName || party.name || "";
        customerPhone = customerPhone || party.phone || "";
        customerAddress = customerAddress || party.address || "";
        customerGst = customerGst || party.gst || "";
      }

      // Find or create Customer using clean phone number
      const customer = await getOrCreateCustomerService(
        {
          customerName,
          customerPhone,
          customerAddress,
          customerCity,
          customerPan,
          customerGst,
          customerState,
        },
        numericStoreId,
        tx
      );

      const customerId = customer?.id || null;

      const storeState = (store.state || "ODISHA").trim().toUpperCase();
      const placeOfSupply = (
        data.placeOfSupply ||
        customerState ||
        storeState
      ).trim().toUpperCase();

      const isInterState =
        placeOfSupply !== "" &&
        placeOfSupply !== storeState;

      const cinNo = data.cinNo || store.cinNo || "U36911OR2005PTCC008217";
      const storeGst = data.storeGst || store.gstNo || "21AAFCA3795A1Z5";
      const cashierName =
        data.cashierName ||
        user?.name ||
        user?.email ||
        store.storeName ||
        "Cashier";

      /*
      ========================================
      2. VALIDATE INVENTORY (AVAILABLE & UNIQUE)
      ========================================
      */
      const inventoryIds = data.items.map((item) => Number(item.inventoryId));
      const uniqueInventoryIds = new Set(inventoryIds);

      if (uniqueInventoryIds.size !== inventoryIds.length) {
        throw saleError(
          "The same inventory item / barcode cannot be added more than once in the same sale."
        );
      }

      const inventories = [];
      for (const invId of inventoryIds) {
        const inv = await validateInventory(tx, invId, numericStoreId);
        inventories.push(inv);
      }

      /*
      ========================================
      3. CALCULATE SALE ITEMS
      ========================================
      */
      const saleItems = data.items.map((item, index) => {
        const inventory = inventories[index];

        const pieces = Math.max(1, Number(item.pieces || 1));
        const grossWeight = Number(
          item.grossWeight !== undefined && item.grossWeight !== null && item.grossWeight !== ""
            ? item.grossWeight
            : inventory.grossWeight ?? 0
        );
        const stoneWeight = Number(
          item.stoneWeight !== undefined && item.stoneWeight !== null && item.stoneWeight !== ""
            ? item.stoneWeight
            : inventory.stoneWeight ?? 0
        );
        const netWeight = Number(
          item.netWeight !== undefined && item.netWeight !== null && item.netWeight !== ""
            ? item.netWeight
            : inventory.netWeight ?? Math.max(0, grossWeight - stoneWeight)
        );

        const rate = Number(item.rate || 0);
        const metalAmount = roundMoney(netWeight * rate);

        const makingChargeType = (item.makingChargeType || "PERCENT").toUpperCase();
        const makingChargeRate = Number(item.makingChargeRate ?? item.makingChargePercent ?? 0);

        let makingCharges = 0;
        if (item.makingCharges !== undefined && item.makingCharges !== null && Number(item.makingCharges) > 0 && makingChargeRate === 0) {
          makingCharges = roundMoney(Number(item.makingCharges));
        } else if (makingChargeType === "PERCENT") {
          makingCharges = roundMoney((metalAmount * makingChargeRate) / 100);
        } else if (makingChargeType === "PER_GRAM") {
          makingCharges = roundMoney(netWeight * makingChargeRate);
        } else {
          makingCharges = roundMoney(Number(item.makingCharges || makingChargeRate || 0));
        }

        const stoneAmount = roundMoney(Number(item.stoneAmount || 0));
        const hallmarkCharges = roundMoney(Number(item.hallmarkCharges || 0));
        const otherCharges = roundMoney(
          Number(item.otherCharges ?? item.otherAmount ?? 0)
        );
        const itemDiscount = roundMoney(Number(item.discount || 0));

        const itemTotalAmount = roundMoney(
          metalAmount +
          makingCharges +
          stoneAmount +
          hallmarkCharges +
          otherCharges -
          itemDiscount
        );

        const particulars =
          item.particulars?.trim() ||
          inventory.item?.name ||
          inventory.product?.name ||
          "Jewellery Item";

        const itemCode =
          item.itemCode?.trim() ||
          inventory.barcodeNo ||
          inventory.tagNo ||
          inventory.inventoryCode ||
          "";

        const huidNo = item.huidNo?.trim() || inventory.huidNo || null;
        const hsnCode = item.hsnCode?.trim() || inventory.hsnCode || "711319";
        const purityName =
          item.purityName?.trim() ||
          inventory.purityMaster?.name ||
          (inventory.purity ? `${inventory.purity}K` : "22K");

        return {
          inventoryId: inventory.id,
          particulars,
          itemCode,
          huidNo,
          hsnCode,
          purityName,
          pieces,
          grossWeight,
          stoneWeight,
          netWeight,
          purity:
            item.purity !== undefined && item.purity !== null
              ? Number(item.purity)
              : inventory.purity,
          rate,
          metalAmount,
          makingCharges,
          makingChargeType,
          makingChargeRate,
          stoneAmount,
          hallmarkCharges,
          otherCharges,
          otherAmount: otherCharges,
          discount: itemDiscount,
          taxableAmount: itemTotalAmount,
          totalAmount: itemTotalAmount,
          cgst: 0,
          sgst: 0,
          igst: 0,
          taxAmount: 0,
        };
      });

      /*
      ========================================
      4. SUMMARY & TAX CALCULATIONS (GST)
      ========================================
      */
      const grossAmount = roundMoney(
        saleItems.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
      );

      const offerDiscount = roundMoney(Number(data.offerDiscount || 0));
      const discount = roundMoney(Number(data.discount || 0));
      const taxableAmount = roundMoney(
        Math.max(0, grossAmount - offerDiscount - discount)
      );

      let cgstPercent = 0;
      let cgstAmount = 0;
      let sgstPercent = 0;
      let sgstAmount = 0;
      let igstPercent = 0;
      let igstAmount = 0;

      if (isInterState) {
        igstPercent = 3.0;
        igstAmount = roundMoney((taxableAmount * 3.0) / 100);
      } else {
        cgstPercent = 1.5;
        cgstAmount = roundMoney((taxableAmount * 1.5) / 100);
        sgstPercent = 1.5;
        sgstAmount = roundMoney((taxableAmount * 1.5) / 100);
      }

      const totalTax = roundMoney(cgstAmount + sgstAmount + igstAmount);
      const subTotal = roundMoney(taxableAmount + totalTax);

      /*
      ========================================
      5. PROCESS ADJUSTMENTS (ADVANCE & OLD JEWELLERY)
      ========================================
      */
      let totalAdvanceAdjusted = 0;
      let totalOldGoldAdjusted = 0;
      const saleAdvanceAdjustmentsToCreate = [];
      const saleOldGoldsToCreate = [];
      const customerAdjustmentLogsToCreate = [];

      // 5A. Process Advance Payment Adjustments
      if (data.advanceAdjustments && Array.isArray(data.advanceAdjustments)) {
        for (const adj of data.advanceAdjustments) {
          const reqAmount = roundMoney(Number(adj.amount || adj.adjustedAmount || 0));
          if (reqAmount <= 0) continue;

          const advance = await tx.advanceReceive.findFirst({
            where: {
              id: Number(adj.advanceReceiveId || adj.id),
              storeId: numericStoreId,
            },
            include: {
              saleAdjustments: true,
            },
          });

          if (!advance) {
            throw saleError(`Advance receipt #${adj.advanceReceiveId || adj.id} was not found.`);
          }

          const usedSum = roundMoney(
            advance.saleAdjustments.reduce((s, sa) => s + Number(sa.amount || sa.adjustedAmount || 0), 0)
          );
          const totalAdvAmount = roundMoney(Number(advance.amount || 0));
          const availableBalance = roundMoney(Math.max(0, totalAdvAmount - usedSum));

          if (reqAmount > availableBalance + 0.01) {
            throw saleError(
              `Requested advance adjustment (Rs. ${formatMoney(reqAmount)}) exceeds available balance (Rs. ${formatMoney(availableBalance)}) for receipt ADV-${advance.id}.`
            );
          }

          const newUsed = roundMoney(usedSum + reqAmount);
          const remainingBalance = roundMoney(Math.max(0, totalAdvAmount - newUsed));

          // Update Advance Receive record
          await tx.advanceReceive.update({
            where: { id: advance.id },
            data: {
              adjustedAmount: newUsed,
              balanceAmount: remainingBalance,
              status: remainingBalance <= 0.01 ? "FULLY_ADJUSTED" : "PARTIALLY_ADJUSTED",
              customerId: customerId || advance.customerId || undefined,
            },
          });

          saleAdvanceAdjustmentsToCreate.push({
            advanceReceiveId: advance.id,
            storeId: numericStoreId,
            amount: reqAmount,
            adjustedAmount: reqAmount,
            previousBalance: availableBalance,
            remainingBalance,
            cashierName,
          });

          if (customerId) {
            customerAdjustmentLogsToCreate.push({
              customerId,
              storeId: numericStoreId,
              adjustmentType: "ADVANCE",
              referenceId: advance.id,
              referenceDocNo: `ADV-${advance.id}`,
              saleInvoiceNo: invoiceNo,
              totalOriginal: totalAdvAmount,
              previousBalance: availableBalance,
              adjustedAmount: reqAmount,
              remainingBalance,
              cashierName,
              notes: adj.notes || `Advance adjusted in sale ${invoiceNo}`,
            });
          }

          totalAdvanceAdjusted = roundMoney(totalAdvanceAdjusted + reqAmount);
        }
      }

      // 5B. Process Old Jewellery Adjustments
      if (data.oldGoldAdjustments && Array.isArray(data.oldGoldAdjustments)) {
        for (const og of data.oldGoldAdjustments) {
          const reqAmount = roundMoney(Number(og.amount || og.value || og.adjustedAmount || 0));
          if (reqAmount <= 0) continue;

          const purchase = await tx.purchase.findFirst({
            where: {
              id: Number(og.purchaseId || og.id),
              purchaseType: "OLD",
              storeId: numericStoreId,
            },
            include: {
              saleOldGolds: true,
              items: {
                include: {
                  item: true,
                  product: true,
                },
              },
            },
          });

          if (!purchase) {
            throw saleError(`Old jewellery purchase record #${og.purchaseId || og.id} was not found.`);
          }

          const totalValuation = roundMoney(Number(purchase.netPayable || purchase.totalAmount || purchase.grossAmount || 0));
          const usedSum = roundMoney(
            purchase.saleOldGolds.reduce((s, sog) => s + Number(sog.value || sog.adjustedAmount || 0), 0)
          );
          const availableValue = roundMoney(Math.max(0, totalValuation - usedSum));

          if (reqAmount > availableValue + 0.01) {
            throw saleError(
              `Requested old jewellery adjustment (Rs. ${formatMoney(reqAmount)}) exceeds available value (Rs. ${formatMoney(availableValue)}) for invoice ${purchase.invoiceNo || purchase.id}.`
            );
          }

          const newUsed = roundMoney(usedSum + reqAmount);
          const remainingBalance = roundMoney(Math.max(0, totalValuation - newUsed));

          // Update Purchase record
          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              adjustedAmount: newUsed,
              balanceAmount: remainingBalance,
              adjustmentStatus: remainingBalance <= 0.01 ? "FULLY_ADJUSTED" : "PARTIALLY_ADJUSTED",
              customerId: customerId || purchase.customerId || undefined,
            },
          });

          const primaryItem = purchase.items?.[0];
          saleOldGoldsToCreate.push({
            purchaseId: purchase.id,
            storeId: numericStoreId,
            description: og.description || primaryItem?.item?.name || primaryItem?.product?.name || "Old Jewellery Value Adjusted",
            grossWeight: Number(primaryItem?.grossWeight || 0),
            stoneWeight: Number(primaryItem?.stoneWeight || 0),
            netWeight: Number(primaryItem?.netWeight || 0),
            purity: primaryItem?.purity ? Number(primaryItem.purity) : null,
            rate: Number(primaryItem?.rate || 0),
            metalAmount: Number(primaryItem?.metalAmount || 0),
            deductionAmount: 0,
            value: reqAmount,
            adjustedAmount: reqAmount,
            previousBalance: availableValue,
            remainingBalance,
            cashierName,
          });

          if (customerId) {
            customerAdjustmentLogsToCreate.push({
              customerId,
              storeId: numericStoreId,
              adjustmentType: "OLD_JEWELLERY",
              referenceId: purchase.id,
              referenceDocNo: purchase.invoiceNo || `PUR-OLD-${purchase.id}`,
              saleInvoiceNo: invoiceNo,
              totalOriginal: totalValuation,
              previousBalance: availableValue,
              adjustedAmount: reqAmount,
              remainingBalance,
              cashierName,
              notes: og.notes || `Old Jewellery adjusted in sale ${invoiceNo}`,
            });
          }

          totalOldGoldAdjusted = roundMoney(totalOldGoldAdjusted + reqAmount);
        }
      }

      const totalDeductions = roundMoney(totalAdvanceAdjusted + totalOldGoldAdjusted);
      const lessUrd = roundMoney(Number(data.lessUrd || 0) + totalOldGoldAdjusted);

      const unroundedNet = roundMoney(Math.max(0, subTotal - totalDeductions));
      let roundOff = 0;
      if (data.roundOff !== undefined && data.roundOff !== null && data.roundOff !== "") {
        roundOff = roundMoney(Number(data.roundOff));
      } else {
        const roundedInt = Math.round(unroundedNet);
        roundOff = roundMoney(roundedInt - unroundedNet);
      }

      const netPayable = roundMoney(Math.max(0, unroundedNet + roundOff));
      const amountInWords = numberToWordsIndian(netPayable);

      /*
      ========================================
      6. PAYMENTS VALIDATION & COLLECTION
      ========================================
      */
      const payments = [];
      let paidAmount = 0;

      if (data.payments && Array.isArray(data.payments)) {
        for (const payment of data.payments) {
          const mode = (payment.paymentMode || "CASH").toUpperCase();
          if (!paymentModes.includes(mode)) {
            throw saleError(`Payment mode "${payment.paymentMode}" is not supported.`);
          }

          const amount = roundMoney(Number(payment.amount || 0));
          if (amount > 0) {
            payments.push({
              storeId: numericStoreId,
              paymentMode: mode,
              amount,
              paymentChannel: payment.paymentChannel || null,
              transactionId: payment.transactionId || payment.referenceNo || null,
              referenceNo: payment.referenceNo || payment.transactionId || null,
              paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : new Date(),
              description: payment.description || payment.narration || null,
              narration: payment.narration || payment.description || null,
            });
            paidAmount = roundMoney(paidAmount + amount);
          }
        }
      }

      if (paidAmount > netPayable + 0.01) {
        throw saleError(
          `Payment amount (${formatMoney(paidAmount)}) cannot exceed net payable (${formatMoney(netPayable)}).`
        );
      }

      const dueAmount = roundMoney(Math.max(0, netPayable - paidAmount));

      /*
      ========================================
      7. CREATE SALE IN DATABASE
      ========================================
      */
      const sale = await createSaleRepo(
        {
          invoiceNo,
          storeId: numericStoreId,
          partyId,
          customerId,
          saleDate: data.saleDate ? new Date(data.saleDate) : new Date(),
          status: "COMPLETED",

          customerName: customerName || null,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          customerCity: customerCity || null,
          customerPan: customerPan || null,
          customerGst: customerGst || null,
          customerState: customerState || null,
          placeOfSupply,

          cinNo,
          storeGst,
          cashierName,
          irnNo: data.irnNo || null,
          isCustomerCopy: data.isCustomerCopy !== undefined ? Boolean(data.isCustomerCopy) : true,

          grossAmount,
          offerDiscount,
          discount,
          taxableAmount,

          cgstPercent,
          cgstAmount,
          sgstPercent,
          sgstAmount,
          igstPercent,
          igstAmount,
          totalTax,

          subTotal,
          lessUrd,
          roundOff,

          // Legacy fields for backward compatibility
          subtotal: grossAmount,
          igst: igstAmount,
          cgst: cgstAmount,
          sgst: sgstAmount,
          taxAmount: totalTax,
          grossTotal: netPayable,
          oldGoldAmount: totalOldGoldAdjusted,
          advanceAmount: totalAdvanceAdjusted,

          payableAmount: netPayable,
          netPayable,
          paidAmount,
          dueAmount,
          amountInWords,

          termsAccepted: true,
          narration: data.narration || null,

          items: {
            create: saleItems,
          },

          payments: {
            create: payments,
          },

          advanceAdjustments: {
            create: saleAdvanceAdjustmentsToCreate,
          },

          oldGolds: {
            create: saleOldGoldsToCreate,
          },
        },
        tx
      );

      /*
      ========================================
      8. CREATE CUSTOMER ADJUSTMENT LOGS
      ========================================
      */
      for (const log of customerAdjustmentLogsToCreate) {
        await createCustomerAdjustmentLogRepo(
          {
            ...log,
            saleId: sale.id,
          },
          tx
        );
      }

      /*
      ========================================
      9. UPDATE INVENTORY STATUS -> SOLD
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
      isolationLevel: "Serializable",
    }
  );
};

export const getSalesService = async (storeId) => {
  return getSalesRepo(Number(storeId));
};

export const getSaleByIdService = async (id, storeId) => {
  const sale = await getSaleByIdRepo(Number(id), Number(storeId));

  if (!sale) {
    throw saleError(
      "Sale record not found. It may have been removed or you may not have access to it."
    );
  }

  return sale;
};

export const getSaleCountService = async (storeId) => {
  return getSaleCountRepo(Number(storeId));
};
