import prisma from "../config/db.js";
import * as transferRepo from "../repositories/inventoryTransferRepository.js";

const extractInventoryCodeNumber = (value) => {
  if (!value) return 0;

  const match = String(value).trim().match(/^INV-(\d+)$/i);
  return match ? Number(match[1]) : 0;
};

const extractSequenceNumber = (value, prefix) => {
  if (!value) return 0;
  const normalized = String(value).trim();

  if (prefix) {
    const match = normalized.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return match ? Number(match[1]) : 0;
  }

  // Barcode numbers are generated as 890000 + 6 digit sequence.
  // Extract only the trailing 6-digit sequence instead of the full barcode.
  const barcodeMatch = normalized.match(/^890000(\d{6})$/);
  if (barcodeMatch) {
    return Number(barcodeMatch[1]);
  }

  const match = normalized.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const getNextStoreSequence = async (tx, storeId) => {
  const inventories = await tx.inventory.findMany({
    where: {
      storeId: Number(storeId),
    },
    select: {
      inventoryCode: true,
      tagNo: true,
      barcodeNo: true,
    },
  });

  const nextFromInventoryCode = inventories.reduce(
    (max, inventory) => Math.max(max, extractInventoryCodeNumber(inventory.inventoryCode)),
    0
  );

  const nextFromLabels = inventories.reduce((max, inventory) => {
    return Math.max(
      max,
      extractSequenceNumber(inventory.tagNo, "TAG"),
      extractSequenceNumber(inventory.tagNo, "OLD"),
      extractSequenceNumber(inventory.tagNo, "BUL"),
      extractSequenceNumber(inventory.barcodeNo)
    );
  }, 0);

  return Math.max(nextFromInventoryCode, nextFromLabels) + 1;
};

const generateInventoryCode = (sequenceNumber) =>
  `INV-${String(sequenceNumber).padStart(6, "0")}`;

const generateBarcodeNo = (sequenceNumber) =>
  `890000${String(sequenceNumber).padStart(6, "0")}`;

const generateTagNo = (sequenceNumber, purchaseType) => {
  let prefix = "TAG";

  if (purchaseType === "OLD") {
    prefix = "OLD";
  }

  if (purchaseType === "BULLION") {
    prefix = "BUL";
  }

  return `${prefix}-${String(sequenceNumber).padStart(6, "0")}`;
};


// =====================================================
// 1. GENERATE TRANSFER NUMBER
// =====================================================

const generateTransferNo = async (tx, storeId) => {
  const counter = await tx.storeCounter.upsert({
    where: {
      storeId: Number(storeId),
    },

    create: {
      storeId: Number(storeId),
      lastTransferNumber: 1,
    },

    update: {
      lastTransferNumber: {
        increment: 1,
      },
    },

    select: {
      lastTransferNumber: true,
    },
  });

  return `TRF-${String(counter.lastTransferNumber).padStart(6, "0")}-S${String(storeId)}`;
};


// =====================================================
// 2. VALIDATE STORE
// =====================================================

const validateStore = async (storeId) => {
  const store = await prisma.store.findUnique({
    where: {
      id: Number(storeId),
    },
  });

  if (!store) {
    throw new Error(`Store ${storeId} not found`);
  }

  return store;
};


// =====================================================
// 3. CREATE TRANSFER
// =====================================================

export const createTransferService = async ({
  fromStoreId,
  toStoreId,
  inventoryIds,
  narration,
}) => {

  fromStoreId = Number(fromStoreId);
  toStoreId = Number(toStoreId);

  if (!fromStoreId) {
    throw new Error("Source store is required");
  }

  if (!toStoreId) {
    throw new Error("Destination store is required");
  }

  if (fromStoreId === toStoreId) {
    throw new Error(
      "Source and destination store cannot be same"
    );
  }

  if (
    !Array.isArray(inventoryIds) ||
    inventoryIds.length === 0
  ) {
    throw new Error(
      "At least one inventory item is required"
    );
  }

  const uniqueInventoryIds = [
    ...new Set(inventoryIds.map(Number)),
  ];

  if (
    uniqueInventoryIds.length !== inventoryIds.length
  ) {
    throw new Error(
      "Duplicate inventory items are not allowed"
    );
  }

  await validateStore(fromStoreId);
  await validateStore(toStoreId);

  const inventories =
    await transferRepo.getInventoryForTransferRepo(
      uniqueInventoryIds,
      fromStoreId
    );

  if (
    inventories.length !== uniqueInventoryIds.length
  ) {
    throw new Error(
      "One or more inventory items do not belong to source store"
    );
  }

  const invalidInventory = inventories.find(
    (inventory) =>
      inventory.status !== "AVAILABLE"
  );

  if (invalidInventory) {
    throw new Error(
      `Inventory ${invalidInventory.inventoryCode} is not available for transfer`
    );
  }

  const activeTransfers =
    await transferRepo.getActiveTransferItemRepo(
      uniqueInventoryIds
    );

  if (activeTransfers.length > 0) {
    throw new Error(
      "One or more inventory items already have an active transfer"
    );
  }

  return await prisma.$transaction(async (tx) => {

    const transferNo =
      await generateTransferNo(
        tx,
        fromStoreId
      );

  const transfer =
      await transferRepo.createTransferRepo(
        tx,
        {
          transferNo,
          fromStoreId,
          toStoreId,
          narration: narration || null,
          status: "PENDING",

          items: {
            create: uniqueInventoryIds.map(
              (inventoryId) => ({
                inventory: {
                  connect: {
                    id: inventoryId,
                  },
                },
              })
            ),
          },
        }
      );

    await transferRepo.updateInventoryStatusRepo(
      tx,
      uniqueInventoryIds,
      "PENDING",
      fromStoreId
    );

    return transfer;
  });
};


// =====================================================
// 4. GET ALL TRANSFERS
// =====================================================

export const getTransfersService = async ({
  storeId,
  status,
}) => {

  return await transferRepo.getTransfersRepo({
    storeId,
    status,
  });
};


// =====================================================
// 5. GET TRANSFER BY ID
// =====================================================

export const getTransferByIdService = async (id) => {

  const transfer =
    await transferRepo.getTransferByIdRepo(id);

  if (!transfer) {
    throw new Error(
      "Inventory transfer not found"
    );
  }

  return transfer;
};


export const updateTransferService = async ({
  transferId,
  fromStoreId,
  toStoreId,
  inventoryIds,
  narration,
}) => {
  const transfer =
    await transferRepo.getTransferByIdRepo(transferId);

  if (!transfer) {
    throw new Error("Inventory transfer not found");
  }

  if (
    Number(transfer.fromStoreId) !==
    Number(fromStoreId)
  ) {
    throw new Error(
      "You are not authorized to update this transfer"
    );
  }

  if (transfer.status !== "PENDING") {
    throw new Error(
      "Only PENDING transfer can be updated"
    );
  }

  if (!toStoreId) {
    throw new Error("Destination store is required");
  }

  if (Number(fromStoreId) === Number(toStoreId)) {
    throw new Error(
      "Source and destination store cannot be same"
    );
  }

  if (
    !Array.isArray(inventoryIds) ||
    inventoryIds.length === 0
  ) {
    throw new Error("inventoryIds are required");
  }

  const uniqueInventoryIds = [
    ...new Set(inventoryIds.map(Number)),
  ];

  const oldInventoryIds = transfer.items.map(
    (item) => item.inventoryId
  );
  const oldInventoryIdSet = new Set(
    oldInventoryIds.map(Number)
  );
  const oldInventoryIdsToRelease = oldInventoryIds.filter(
    (inventoryId) => !uniqueInventoryIds.includes(Number(inventoryId))
  );
  const newInventoryIds = uniqueInventoryIds.filter(
    (inventoryId) => !oldInventoryIdSet.has(inventoryId)
  );

  // Make sure inventory belongs to source store
  const inventories =
    await transferRepo.getInventoryForTransferRepo(
      uniqueInventoryIds,
      fromStoreId
    );

  if (
    inventories.length !==
    uniqueInventoryIds.length
  ) {
    throw new Error(
      "One or more inventory items do not belong to source store"
    );
  }

  const invalidInventory = inventories.find(
    (inventory) =>
      !oldInventoryIdSet.has(Number(inventory.id)) &&
      inventory.status !== "AVAILABLE"
  );

  if (invalidInventory) {
    throw new Error(
      `Inventory ${invalidInventory.inventoryCode} is not available`
    );
  }

  return await prisma.$transaction(async (tx) => {

    // Remove old transfer items
    await tx.inventoryTransferItem.deleteMany({
      where: {
        transferId: Number(transferId),
      },
    });

    // Update transfer
    await tx.inventoryTransfer.update({
      where: {
        id: Number(transferId),
      },
      data: {
        toStoreId: Number(toStoreId),
        narration: narration || null,

        items: {
          create: uniqueInventoryIds.map(
            (inventoryId) => ({
              inventory: {
                connect: {
                  id: inventoryId,
                },
              },
            })
          ),
        },
      },
    });

    if (oldInventoryIdsToRelease.length > 0) {
      await transferRepo.updateInventoryStatusRepo(
        tx,
        oldInventoryIdsToRelease,
        "AVAILABLE",
        fromStoreId
      );
    }

    if (newInventoryIds.length > 0) {
      await transferRepo.updateInventoryStatusRepo(
        tx,
        newInventoryIds,
        "PENDING",
        fromStoreId
      );
    }

    return await transferRepo.getTransferByIdRepo(
      transferId
    );
  });
};
// =====================================================
// 7. RECEIVE TRANSFER
// =====================================================

export const receiveTransferService = async ({
  transferId,
  toStoreId,
}) => {
  const transfer =
    await transferRepo.getTransferByIdRepo(transferId);

  if (!transfer) {
    throw new Error("Inventory transfer not found");
  }

  // Only destination store can receive
  if (
    Number(transfer.toStoreId) !== Number(toStoreId)
  ) {
    throw new Error(
      "You are not authorized to receive this transfer"
    );
  }

  // Only PENDING transfer can be received
  if (transfer.status !== "PENDING") {
    throw new Error(
      `Transfer cannot be received from ${transfer.status} status`
    );
  }

  const inventoryIds = transfer.items.map(
    (item) => item.inventoryId
  );

  return await prisma.$transaction(async (tx) => {
    let nextSequence = await getNextStoreSequence(tx, toStoreId);

    // 1. RENUMBER INVENTORY FOR DESTINATION STORE, THEN MOVE IT
    for (const item of transfer.items) {
      const sequence = nextSequence;
      nextSequence += 1;

      const updatedInventory = item.inventory;
      const newInventoryCode = generateInventoryCode(sequence);
      const newBarcodeNo = generateBarcodeNo(sequence);
      const newTagNo =
        updatedInventory.purchaseType === "ORNAMENT" ||
        updatedInventory.purchaseType === "OLD" ||
        updatedInventory.purchaseType === "BULLION"
          ? generateTagNo(sequence, updatedInventory.purchaseType)
          : null;

      await tx.inventory.updateMany({
        where: {
          id: Number(item.inventoryId),
        },
        data: {
          storeId: Number(toStoreId),
          inventoryCode: newInventoryCode,
          barcodeNo: newBarcodeNo,
          tagNo: newTagNo,
          status: "AVAILABLE",
        },
      });
    }

    // 2. CHANGE TRANSFER STATUS
    await transferRepo.updateTransferStatusRepo(
      tx,
      transferId,
      "RECEIVED",
      new Date()
    );

    // 3. GET UPDATED TRANSFER
    return await transferRepo.getTransferByIdRepo(
      transferId
    );
  });
};

export const cancelTransferService = async ({
  transferId,
  storeId,
}) => {
  const transfer =
    await transferRepo.getTransferByIdRepo(transferId);

  if (!transfer) {
    throw new Error("Inventory transfer not found");
  }

  if (
    Number(transfer.fromStoreId) !== Number(storeId) &&
    Number(transfer.toStoreId) !== Number(storeId)
  ) {
    throw new Error(
      "You are not authorized to cancel this transfer"
    );
  }

  if (transfer.status !== "PENDING") {
    throw new Error(
      `Transfer cannot be cancelled from ${transfer.status} status`
    );
  }

  const inventoryIds = transfer.items.map(
    (item) => item.inventoryId
  );

  return await prisma.$transaction(async (tx) => {
    await transferRepo.updateInventoryStatusRepo(
      tx,
      inventoryIds,
      "AVAILABLE",
      transfer.fromStoreId
    );

    await transferRepo.updateTransferStatusRepo(
      tx,
      transferId,
      "CANCELLED"
    );

    return await transferRepo.getTransferByIdRepo(
      transferId
    );
  });
};






