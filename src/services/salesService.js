import prisma from "../config/db.js";
import {
  createSaleRepo,
  getSaleByIdRepo,
  getSalesRepo,
  getSaleCountRepo,
} from "../repositories/salesRepository.js";

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
            "The selected customer is not linked to this store. Please choose a valid customer."
          );
        }

        partyId = Number(data.partyId);
        customerName = customerName || party.name || "";
        customerPhone = customerPhone || party.phone || "";
        customerAddress = customerAddress || party.address || "";
        customerGst = customerGst || party.gst || "";
      }

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
      const lessUrd = roundMoney(Number(data.lessUrd || 0));

      const unroundedNet = roundMoney(subTotal - lessUrd);
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
      5. PAYMENTS
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

      if (paidAmount > netPayable) {
        throw saleError(
          `Payment amount (${formatMoney(paidAmount)}) cannot exceed net payable (${formatMoney(netPayable)}).`
        );
      }

      const dueAmount = roundMoney(Math.max(0, netPayable - paidAmount));

      /*
      ========================================
      6. CREATE SALE IN DATABASE
      ========================================
      */
      const sale = await createSaleRepo(
        {
          invoiceNo,
          storeId: numericStoreId,
          partyId,
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
          oldGoldAmount: 0,
          advanceAmount: 0,

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
        },
        tx
      );

      /*
      ========================================
      7. UPDATE INVENTORY STATUS -> SOLD
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
