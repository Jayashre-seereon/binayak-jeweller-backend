import prisma from "../config/db.js";

export const createDesignRepo = (data) => {
  const { designStones, ...rest } = data;
  return prisma.design.create({
    data: {
      ...rest,
      ...(designStones && designStones.length > 0
        ? {
            designStones: {
              create: designStones.map((s) => ({
                stoneId: Number(s.stoneId),
                pieces: Number(s.pieces || 1),
                expectedWeight: Number(s.expectedWeight || 0),
                unit: s.unit || "ct",
              })),
            },
          }
        : {}),
    },
    include: {
      product: true,
      designStones: {
        include: {
          stone: true,
        },
      },
    },
  });
};

export const getDesignsByStore = (storeId) => {
  return prisma.design.findMany({
    where: { storeId: Number(storeId) },
    include: {
      product: true,
      designStones: {
        include: {
          stone: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
};

export const getDesignByIdRepo = (id) => {
  return prisma.design.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      product: true,
      designStones: {
        include: {
          stone: true,
        },
      },
    },
  });
};

export const updateDesignRepo = async (id, data) => {
  const { designStones, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    if (designStones !== undefined) {
      await tx.designStone.deleteMany({
        where: { designId: Number(id) },
      });

      if (Array.isArray(designStones) && designStones.length > 0) {
        await tx.designStone.createMany({
          data: designStones.map((s) => ({
            designId: Number(id),
            stoneId: Number(s.stoneId),
            pieces: Number(s.pieces || 1),
            expectedWeight: Number(s.expectedWeight || 0),
            unit: s.unit || "ct",
          })),
        });
      }
    }

    return await tx.design.update({
      where: { id: Number(id) },
      data: rest,
      include: {
        product: true,
        designStones: {
          include: {
            stone: true,
          },
        },
      },
    });
  });
};

export const deleteDesignRepo = (id) => {
  return prisma.design.delete({
    where: { id: Number(id) },
  });
};

