import prisma from "../config/db.js";
import { generateVoucherNo, peekNextVoucherNo } from "../utils/voucherCodeGenerator.js";
import { getOrCreateCustomerService } from "./customerService.js";

const roundMoney = (val) =>
  Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;

export const DEFAULT_ACCOUNTS = [
  { accountName: "Cash in Hand", accountGroup: "Cash", accountType: "ASSET", isSystem: true },
  { accountName: "Bank / UPI Account", accountGroup: "Bank", accountType: "ASSET", isSystem: true },
  { accountName: "Customer Receivables", accountGroup: "Sundry Debtors", accountType: "ASSET", isSystem: true },
  { accountName: "Supplier Payables", accountGroup: "Sundry Creditors", accountType: "LIABILITY", isSystem: true },
  { accountName: "Customer Advances", accountGroup: "Current Liabilities", accountType: "LIABILITY", isSystem: true },
  { accountName: "Jewellery Sales Account", accountGroup: "Sales", accountType: "INCOME", isSystem: true },
  { accountName: "Jewellery Purchase Account", accountGroup: "Purchases", accountType: "EXPENSE", isSystem: true },
  { accountName: "Salary Expense", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Rent Expense", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Electricity Expense", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Transport Expense", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Bank Charges", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Depreciation Expense", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Other Business Expenses", accountGroup: "Indirect Expenses", accountType: "EXPENSE", isSystem: false },
  { accountName: "Other Income", accountGroup: "Indirect Income", accountType: "INCOME", isSystem: false },
  { accountName: "Capital / Owner Equity", accountGroup: "Capital", accountType: "EQUITY", isSystem: false },
];

export const ensureDefaultAccounts = async (storeId, tx = prisma) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) return;

  for (const acc of DEFAULT_ACCOUNTS) {
    await tx.account.upsert({
      where: {
        storeId_accountName: {
          storeId: numericStoreId,
          accountName: acc.accountName,
        },
      },
      update: {},
      create: {
        storeId: numericStoreId,
        accountName: acc.accountName,
        accountGroup: acc.accountGroup,
        accountType: acc.accountType,
        isSystem: acc.isSystem,
      },
    });
  }
};

export const getAccountsService = async (storeId) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  await ensureDefaultAccounts(numericStoreId);

  const accounts = await prisma.account.findMany({
    where: { storeId: numericStoreId },
    orderBy: [{ accountGroup: "asc" }, { accountName: "asc" }],
  });

  return accounts;
};

export const getCustomerPendingSalesService = async (customerId, phone, storeId) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const cleanPhone = phone ? String(phone).trim().replace(/\D/g, "") : "";
  const numericCustomerId = customerId ? Number(customerId) : null;

  if (!numericCustomerId && !cleanPhone) {
    return [];
  }

  const sales = await prisma.sale.findMany({
    where: {
      storeId: numericStoreId,
      status: "COMPLETED",
      dueAmount: { gt: 0.01 },
      OR: [
        ...(numericCustomerId ? [{ customerId: numericCustomerId }] : []),
        ...(cleanPhone ? [{ customerPhone: cleanPhone }] : []),
      ],
    },
    select: {
      id: true,
      invoiceNo: true,
      saleDate: true,
      customerName: true,
      customerPhone: true,
      netPayable: true,
      paidAmount: true,
      dueAmount: true,
      advanceAmount: true,
      oldGoldAmount: true,
      totalTax: true,
    },
    orderBy: { saleDate: "desc" },
  });

  return sales;
};

export const getSupplierPendingPurchasesService = async (partyId, storeId) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const numericPartyId = partyId ? Number(partyId) : null;
  if (!numericPartyId) return [];

  const purchases = await prisma.purchase.findMany({
    where: {
      storeId: numericStoreId,
      partyId: numericPartyId,
      dueAmount: { gt: 0.01 },
    },
    select: {
      id: true,
      invoiceNo: true,
      date: true,
      customerName: true,
      customerPhone: true,
      referenceNo: true,
      netPayable: true,
      paidAmount: true,
      dueAmount: true,
      totalAmount: true,
      purchaseType: true,
    },
    orderBy: { date: "desc" },
  });

  return purchases;
};

export const createReceiptVoucherService = async (data, storeId, user = null) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const amount = roundMoney(data.amount);
  if (amount <= 0) {
    throw new Error("Receipt amount must be greater than 0.");
  }

  const paymentMode = String(data.paymentMode || "CASH").toUpperCase();
  const validModes = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"];
  if (!validModes.includes(paymentMode)) {
    throw new Error(`Invalid payment mode: ${data.paymentMode}`);
  }

  const referenceType = String(data.referenceType || "OTHER").toUpperCase();
  const date = data.date ? new Date(data.date) : new Date();

  return prisma.$transaction(async (tx) => {
    await ensureDefaultAccounts(numericStoreId, tx);

    const voucherNo = await generateVoucherNo(numericStoreId, "RECEIPT", tx);
    const bankOrCashAccount = paymentMode === "CASH" ? "Cash in Hand" : "Bank / UPI Account";

    let voucherRecord = null;

    if (referenceType === "SALE_INVOICE") {
      const saleId = Number(data.saleId || data.referenceId);
      if (!saleId) {
        throw new Error("Sale Invoice reference is required for Sale Due receipt.");
      }

      const sale = await tx.sale.findFirst({
        where: { id: saleId, storeId: numericStoreId },
      });

      if (!sale) {
        throw new Error(`Sale Invoice #${saleId} not found in this store.`);
      }

      if (sale.status === "CANCELLED") {
        throw new Error(`Sale Invoice ${sale.invoiceNo} has been cancelled.`);
      }

      const pendingDue = roundMoney(sale.dueAmount);
      if (amount > pendingDue + 0.01) {
        throw new Error(
          `Received amount (₹${amount.toFixed(2)}) cannot exceed the pending due amount (₹${pendingDue.toFixed(2)}) for invoice ${sale.invoiceNo}.`
        );
      }

      const newPaid = roundMoney(sale.paidAmount + amount);
      const newDue = roundMoney(Math.max(0, sale.dueAmount - amount));

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
        },
      });

      let salePaymentMode = "CASH";
      if (["UPI", "BANK_TRANSFER"].includes(paymentMode)) salePaymentMode = "UPI";
      else if (paymentMode === "CARD") salePaymentMode = "CARD";
      else if (paymentMode === "CHEQUE") salePaymentMode = "CHEQUE";
      else if (paymentMode === "OTHER") salePaymentMode = "OTHER";

      await tx.salePayment.create({
        data: {
          saleId: sale.id,
          storeId: numericStoreId,
          paymentMode: salePaymentMode,
          amount,
          referenceNo: voucherNo,
          transactionId: data.transactionRef || null,
          description: data.narration || `Receipt Voucher ${voucherNo}`,
          paymentDate: date,
          narration: data.narration || null,
        },
      });

      const customerAccountName = `Customer: ${sale.customerName || data.receivedFrom || "Party"}`;

      voucherRecord = await tx.voucher.create({
        data: {
          voucherNo,
          voucherType: "RECEIPT",
          storeId: numericStoreId,
          date,
          amount,
          paymentMode,
          referenceType: "SALE_INVOICE",
          referenceId: sale.id,
          referenceDocNo: sale.invoiceNo,
          partyType: "CUSTOMER",
          partyId: sale.partyId,
          customerId: sale.customerId,
          partyName: sale.customerName || data.receivedFrom || "Customer",
          partyPhone: sale.customerPhone || data.partyPhone || null,
          bankName: data.bankName || null,
          transactionRef: data.transactionRef || null,
          narration: data.narration || `Received ₹${amount} against Sale Invoice ${sale.invoiceNo}`,
          status: "COMPLETED",
          createdBy: user?.name || "System",
          saleId: sale.id,
          entries: {
            create: [
              {
                storeId: numericStoreId,
                accountName: bankOrCashAccount,
                entryType: "DEBIT",
                debit: amount,
                credit: 0,
                narration: `Receipt Voucher ${voucherNo} via ${paymentMode}`,
                date,
              },
              {
                storeId: numericStoreId,
                accountName: customerAccountName,
                entryType: "CREDIT",
                debit: 0,
                credit: amount,
                narration: `Paid against sale ${sale.invoiceNo}`,
                date,
              },
            ],
          },
        },
        include: { entries: true },
      });
    } else if (referenceType === "ADVANCE") {
      const customerName = (data.receivedFrom || data.customerName || "Customer").trim();
      const customerPhone = data.partyPhone ? String(data.partyPhone).trim().replace(/\D/g, "") : null;

      let customerId = data.customerId ? Number(data.customerId) : null;
      if (!customerId && customerPhone) {
        const cust = await getOrCreateCustomerService(
          {
            customerName,
            customerPhone,
            customerAddress: data.address || null,
          },
          numericStoreId,
          tx
        );
        customerId = cust?.id || null;
      }

      const advPaymentMode = paymentMode === "CASH" ? "CASH" : "ONLINE";

      const advance = await tx.advanceReceive.create({
        data: {
          customerId,
          customerName,
          contactNumber: customerPhone,
          address: data.address || null,
          amount,
          adjustedAmount: 0,
          balanceAmount: amount,
          status: "AVAILABLE",
          receiveDate: date,
          paymentMode: advPaymentMode,
          specification: `Receipt Voucher ${voucherNo}`,
          storeId: numericStoreId,
        },
      });

      const customerAccountName = `Customer Advance: ${customerName}`;

      voucherRecord = await tx.voucher.create({
        data: {
          voucherNo,
          voucherType: "RECEIPT",
          storeId: numericStoreId,
          date,
          amount,
          paymentMode,
          referenceType: "ADVANCE",
          referenceId: advance.id,
          referenceDocNo: `ADV-${advance.id}`,
          partyType: "CUSTOMER",
          partyId: null,
          customerId,
          partyName: customerName,
          partyPhone: customerPhone,
          bankName: data.bankName || null,
          transactionRef: data.transactionRef || null,
          narration: data.narration || `Customer Advance received of ₹${amount}`,
          status: "COMPLETED",
          createdBy: user?.name || "System",
          advanceReceiveId: advance.id,
          entries: {
            create: [
              {
                storeId: numericStoreId,
                accountName: bankOrCashAccount,
                entryType: "DEBIT",
                debit: amount,
                credit: 0,
                narration: `Advance received via ${paymentMode}`,
                date,
              },
              {
                storeId: numericStoreId,
                accountName: customerAccountName,
                entryType: "CREDIT",
                debit: 0,
                credit: amount,
                narration: `Customer advance recorded (ADV-${advance.id})`,
                date,
              },
            ],
          },
        },
        include: { entries: true },
      });
    } else {
      // OTHER RECEIPT
      const receivedFrom = (data.receivedFrom || data.partyName || "Other Source").trim();
      const incomeAccount = data.accountName || "Other Income";

      voucherRecord = await tx.voucher.create({
        data: {
          voucherNo,
          voucherType: "RECEIPT",
          storeId: numericStoreId,
          date,
          amount,
          paymentMode,
          referenceType: "OTHER",
          referenceId: null,
          referenceDocNo: data.referenceDocNo || null,
          partyType: "OTHER",
          partyName: receivedFrom,
          partyPhone: data.partyPhone || null,
          bankName: data.bankName || null,
          transactionRef: data.transactionRef || null,
          narration: data.narration || `Received from ${receivedFrom}`,
          status: "COMPLETED",
          createdBy: user?.name || "System",
          entries: {
            create: [
              {
                storeId: numericStoreId,
                accountName: bankOrCashAccount,
                entryType: "DEBIT",
                debit: amount,
                credit: 0,
                narration: `Received via ${paymentMode}`,
                date,
              },
              {
                storeId: numericStoreId,
                accountName: incomeAccount,
                entryType: "CREDIT",
                debit: 0,
                credit: amount,
                narration: data.narration || `Received from ${receivedFrom}`,
                date,
              },
            ],
          },
        },
        include: { entries: true },
      });
    }

    return voucherRecord;
  });
};

export const createPaymentVoucherService = async (data, storeId, user = null) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const amount = roundMoney(data.amount);
  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0.");
  }

  const paymentMode = String(data.paymentMode || "CASH").toUpperCase();
  const validModes = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE", "OTHER"];
  if (!validModes.includes(paymentMode)) {
    throw new Error(`Invalid payment mode: ${data.paymentMode}`);
  }

  const referenceType = String(data.referenceType || "OTHER").toUpperCase();
  const date = data.date ? new Date(data.date) : new Date();

  return prisma.$transaction(async (tx) => {
    await ensureDefaultAccounts(numericStoreId, tx);

    const voucherNo = await generateVoucherNo(numericStoreId, "PAYMENT", tx);
    const bankOrCashAccount = paymentMode === "CASH" ? "Cash in Hand" : "Bank / UPI Account";

    let voucherRecord = null;

    if (referenceType === "PURCHASE") {
      const purchaseId = Number(data.purchaseId || data.referenceId);
      if (!purchaseId) {
        throw new Error("Purchase invoice reference is required for supplier payment.");
      }

      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, storeId: numericStoreId },
      });

      if (!purchase) {
        throw new Error(`Purchase record #${purchaseId} not found in this store.`);
      }

      const pendingDue = roundMoney(purchase.dueAmount);
      if (amount > pendingDue + 0.01) {
        throw new Error(
          `Payment amount (₹${amount.toFixed(2)}) cannot exceed the pending outstanding balance (₹${pendingDue.toFixed(2)}) for purchase ${purchase.invoiceNo || `#${purchase.id}`}.`
        );
      }

      const newPaid = roundMoney(purchase.paidAmount + amount);
      const newDue = roundMoney(Math.max(0, purchase.dueAmount - amount));

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
        },
      });

      await tx.purchasePayment.create({
        data: {
          purchaseId: purchase.id,
          storeId: numericStoreId,
          paymentMode,
          amount,
          referenceNo: voucherNo,
          transactionId: data.transactionRef || null,
          description: data.narration || `Payment Voucher ${voucherNo}`,
          paymentDate: date,
          narration: data.narration || null,
        },
      });

      const partyName = data.payTo || purchase.customerName || "Supplier";
      const supplierAccountName = `Supplier: ${partyName}`;

      voucherRecord = await tx.voucher.create({
        data: {
          voucherNo,
          voucherType: "PAYMENT",
          storeId: numericStoreId,
          date,
          amount,
          paymentMode,
          referenceType: "PURCHASE",
          referenceId: purchase.id,
          referenceDocNo: purchase.invoiceNo || purchase.referenceNo,
          partyType: "SUPPLIER",
          partyId: purchase.partyId,
          partyName,
          partyPhone: purchase.customerPhone || data.partyPhone || null,
          bankName: data.bankName || null,
          transactionRef: data.transactionRef || null,
          narration: data.narration || `Paid ₹${amount} against Purchase ${purchase.invoiceNo || `#${purchase.id}`}`,
          status: "COMPLETED",
          createdBy: user?.name || "System",
          purchaseId: purchase.id,
          entries: {
            create: [
              {
                storeId: numericStoreId,
                accountName: supplierAccountName,
                entryType: "DEBIT",
                debit: amount,
                credit: 0,
                narration: `Paid for purchase invoice ${purchase.invoiceNo || `#${purchase.id}`}`,
                date,
              },
              {
                storeId: numericStoreId,
                accountName: bankOrCashAccount,
                entryType: "CREDIT",
                debit: 0,
                credit: amount,
                narration: `Payment Voucher ${voucherNo} via ${paymentMode}`,
                date,
              },
            ],
          },
        },
        include: { entries: true },
      });
    } else {
      // EXPENSE, SALARY, RENT, ELECTRICITY, TRANSPORT, OTHER
      const payTo = (data.payTo || data.partyName || "Vendor / Payee").trim();
      let debitAccount = "Other Business Expenses";

      if (referenceType === "SALARY") debitAccount = "Salary Expense";
      else if (referenceType === "RENT") debitAccount = "Rent Expense";
      else if (referenceType === "ELECTRICITY") debitAccount = "Electricity Expense";
      else if (referenceType === "TRANSPORT") debitAccount = "Transport Expense";
      else if (data.accountName) debitAccount = data.accountName;

      voucherRecord = await tx.voucher.create({
        data: {
          voucherNo,
          voucherType: "PAYMENT",
          storeId: numericStoreId,
          date,
          amount,
          paymentMode,
          referenceType,
          referenceId: null,
          referenceDocNo: data.referenceDocNo || null,
          partyType: referenceType === "SALARY" ? "EMPLOYEE" : "EXPENSE",
          partyId: data.partyId ? Number(data.partyId) : null,
          partyName: payTo,
          partyPhone: data.partyPhone || null,
          bankName: data.bankName || null,
          transactionRef: data.transactionRef || null,
          narration: data.narration || `Payment for ${referenceType.toLowerCase()} to ${payTo}`,
          status: "COMPLETED",
          createdBy: user?.name || "System",
          entries: {
            create: [
              {
                storeId: numericStoreId,
                accountName: debitAccount,
                entryType: "DEBIT",
                debit: amount,
                credit: 0,
                narration: `Paid to ${payTo}`,
                date,
              },
              {
                storeId: numericStoreId,
                accountName: bankOrCashAccount,
                entryType: "CREDIT",
                debit: 0,
                credit: amount,
                narration: `Payment Voucher ${voucherNo} via ${paymentMode}`,
                date,
              },
            ],
          },
        },
        include: { entries: true },
      });
    }

    return voucherRecord;
  });
};

export const createJournalEntryService = async (data, storeId, user = null) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  if (!data.entries || !Array.isArray(data.entries) || data.entries.length < 2) {
    throw new Error("Journal entry must have at least two entry lines.");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  const sanitizedEntries = data.entries.map((item, index) => {
    const accountName = String(item.accountName || item.ledger || "").trim();
    if (!accountName) {
      throw new Error(`Account/Ledger name is required on row #${index + 1}.`);
    }

    const debit = roundMoney(item.debit);
    const credit = roundMoney(item.credit);

    if (debit < 0 || credit < 0) {
      throw new Error(`Negative amounts are not allowed on row #${index + 1}.`);
    }

    if (debit === 0 && credit === 0) {
      throw new Error(`Row #${index + 1} must have either a Debit or Credit amount.`);
    }

    totalDebit = roundMoney(totalDebit + debit);
    totalCredit = roundMoney(totalCredit + credit);

    return {
      storeId: numericStoreId,
      accountName,
      entryType: debit > 0 ? "DEBIT" : "CREDIT",
      debit,
      credit,
      narration: item.narration?.trim() || null,
      date: data.date ? new Date(data.date) : new Date(),
    };
  });

  if (totalDebit <= 0) {
    throw new Error("Journal entry total must be greater than 0.");
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Total Debit (₹${totalDebit.toFixed(2)}) must equal Total Credit (₹${totalCredit.toFixed(2)}). Imbalance: ₹${Math.abs(totalDebit - totalCredit).toFixed(2)}.`
    );
  }

  const date = data.date ? new Date(data.date) : new Date();

  return prisma.$transaction(async (tx) => {
    await ensureDefaultAccounts(numericStoreId, tx);
    const voucherNo = await generateVoucherNo(numericStoreId, "JOURNAL", tx);

    const voucherRecord = await tx.voucher.create({
      data: {
        voucherNo,
        voucherType: "JOURNAL",
        storeId: numericStoreId,
        date,
        amount: totalDebit,
        paymentMode: "OTHER",
        referenceType: "JOURNAL_ADJUSTMENT",
        narration: data.narration?.trim() || "Manual Journal Adjustment",
        status: "COMPLETED",
        createdBy: user?.name || "System",
        entries: {
          create: sanitizedEntries,
        },
      },
      include: { entries: true },
    });

    return voucherRecord;
  });
};

export const cancelVoucherService = async (voucherId, storeId, reason, user = null) => {
  const numericStoreId = Number(storeId);
  const numericVoucherId = Number(voucherId);

  if (!numericStoreId || !numericVoucherId) {
    throw new Error("Valid storeId and voucherId are required.");
  }

  return prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.findFirst({
      where: { id: numericVoucherId, storeId: numericStoreId },
      include: { entries: true },
    });

    if (!voucher) {
      throw new Error(`Voucher #${numericVoucherId} not found.`);
    }

    if (voucher.status === "CANCELLED") {
      throw new Error(`Voucher ${voucher.voucherNo} is already cancelled.`);
    }

    // Revert logic based on voucherType
    if (voucher.voucherType === "RECEIPT") {
      if (voucher.referenceType === "SALE_INVOICE" && voucher.referenceId) {
        const sale = await tx.sale.findUnique({
          where: { id: voucher.referenceId },
        });

        if (sale) {
          const revertedPaid = roundMoney(Math.max(0, sale.paidAmount - voucher.amount));
          const revertedDue = roundMoney(sale.dueAmount + voucher.amount);

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              paidAmount: revertedPaid,
              dueAmount: revertedDue,
            },
          });

          await tx.salePayment.deleteMany({
            where: {
              saleId: sale.id,
              referenceNo: voucher.voucherNo,
            },
          });
        }
      } else if (voucher.referenceType === "ADVANCE" && voucher.referenceId) {
        const adv = await tx.advanceReceive.findUnique({
          where: { id: voucher.referenceId },
        });

        if (adv) {
          if (Number(adv.adjustedAmount || 0) > 0.01) {
            throw new Error(
              `Cannot cancel receipt voucher: advance of ₹${adv.adjustedAmount} has already been adjusted against sales.`
            );
          }
          await tx.advanceReceive.update({
            where: { id: adv.id },
            data: {
              status: "CANCELLED",
              balanceAmount: 0,
            },
          });
        }
      }
    } else if (voucher.voucherType === "PAYMENT") {
      if (voucher.referenceType === "PURCHASE" && voucher.referenceId) {
        const purchase = await tx.purchase.findUnique({
          where: { id: voucher.referenceId },
        });

        if (purchase) {
          const revertedPaid = roundMoney(Math.max(0, purchase.paidAmount - voucher.amount));
          const revertedDue = roundMoney(purchase.dueAmount + voucher.amount);

          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              paidAmount: revertedPaid,
              dueAmount: revertedDue,
            },
          });

          await tx.purchasePayment.deleteMany({
            where: {
              purchaseId: purchase.id,
              referenceNo: voucher.voucherNo,
            },
          });
        }
      }
    }

    const updatedVoucher = await tx.voucher.update({
      where: { id: voucher.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledReason: reason || "Cancelled by user",
      },
    });

    await tx.ledgerEntry.updateMany({
      where: { voucherId: voucher.id },
      data: {
        status: "CANCELLED",
      },
    });

    return updatedVoucher;
  });
};

export const getVouchersService = async (type, storeId, query = {}) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const voucherType = String(type).toUpperCase();
  const { search, status, paymentMode, referenceType, startDate, endDate, page = 1, limit = 50 } = query;

  const where = {
    storeId: numericStoreId,
    voucherType,
  };

  if (status) {
    where.status = status;
  }

  if (paymentMode) {
    where.paymentMode = paymentMode;
  }

  if (referenceType) {
    where.referenceType = referenceType;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }

  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { voucherNo: { contains: q, mode: "insensitive" } },
      { partyName: { contains: q, mode: "insensitive" } },
      { partyPhone: { contains: q, mode: "insensitive" } },
      { referenceDocNo: { contains: q, mode: "insensitive" } },
      { narration: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [total, vouchers] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      include: {
        entries: true,
        sale: { select: { id: true, invoiceNo: true, dueAmount: true } },
        purchase: { select: { id: true, invoiceNo: true, dueAmount: true } },
        advanceReceive: {
          select: {
            id: true,
            amount: true,
            adjustedAmount: true,
            balanceAmount: true,
            status: true,
            receiveDate: true,
            paymentMode: true,
            specification: true,
            saleAdjustments: {
              include: {
                sale: {
                  select: {
                    id: true,
                    invoiceNo: true,
                    saleDate: true,
                    netPayable: true,
                  },
                },
              },
              orderBy: { id: "desc" },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    vouchers,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
};

export const getVoucherByIdService = async (voucherId, storeId) => {
  const numericStoreId = Number(storeId);
  const numericVoucherId = Number(voucherId);

  const voucher = await prisma.voucher.findFirst({
    where: { id: numericVoucherId, storeId: numericStoreId },
    include: {
      entries: true,
      sale: true,
      purchase: true,
      customer: true,
      party: true,
      advanceReceive: true,
      store: true,
    },
  });

  if (!voucher) throw new Error("Voucher not found");
  return voucher;
};

export const getAccountingSummaryService = async (storeId) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  const [
    todayReceipts,
    monthReceipts,
    todayPayments,
    monthPayments,
    pendingSales,
    pendingPurchases,
    totalVouchersCount,
  ] = await Promise.all([
    prisma.voucher.aggregate({
      _sum: { amount: true },
      where: {
        storeId: numericStoreId,
        voucherType: "RECEIPT",
        status: "COMPLETED",
        date: { gte: startOfToday },
      },
    }),
    prisma.voucher.aggregate({
      _sum: { amount: true },
      where: {
        storeId: numericStoreId,
        voucherType: "RECEIPT",
        status: "COMPLETED",
        date: { gte: startOfMonth },
      },
    }),
    prisma.voucher.aggregate({
      _sum: { amount: true },
      where: {
        storeId: numericStoreId,
        voucherType: "PAYMENT",
        status: "COMPLETED",
        date: { gte: startOfToday },
      },
    }),
    prisma.voucher.aggregate({
      _sum: { amount: true },
      where: {
        storeId: numericStoreId,
        voucherType: "PAYMENT",
        status: "COMPLETED",
        date: { gte: startOfMonth },
      },
    }),
    prisma.sale.aggregate({
      _sum: { dueAmount: true },
      _count: { id: true },
      where: {
        storeId: numericStoreId,
        status: "COMPLETED",
        dueAmount: { gt: 0.01 },
      },
    }),
    prisma.purchase.aggregate({
      _sum: { dueAmount: true },
      _count: { id: true },
      where: {
        storeId: numericStoreId,
        dueAmount: { gt: 0.01 },
      },
    }),
    prisma.voucher.count({
      where: { storeId: numericStoreId },
    }),
    prisma.advanceReceive.aggregate({
      _sum: { balanceAmount: true, amount: true },
      _count: { id: true },
      where: {
        storeId: numericStoreId,
        status: { not: "CANCELLED" },
        balanceAmount: { gt: 0.01 },
      },
    }),
  ]);

  return {
    todayReceipts: roundMoney(todayReceipts._sum.amount || 0),
    monthReceipts: roundMoney(monthReceipts._sum.amount || 0),
    todayPayments: roundMoney(todayPayments._sum.amount || 0),
    monthPayments: roundMoney(monthPayments._sum.amount || 0),
    totalCustomerDue: roundMoney(pendingSales._sum.dueAmount || 0),
    pendingSalesCount: pendingSales._count.id || 0,
    totalSupplierDue: roundMoney(pendingPurchases._sum.dueAmount || 0),
    pendingPurchasesCount: pendingPurchases._count.id || 0,
    totalAvailableAdvance: roundMoney(availableAdvances._sum.balanceAmount || 0),
    totalAvailableAdvancesCount: availableAdvances._count.id || 0,
    totalVouchersCount,
  };
};

export const getNextVoucherNumberPreviewService = async (type, storeId) => {
  const numericStoreId = Number(storeId);
  return peekNextVoucherNo(numericStoreId, type);
};
