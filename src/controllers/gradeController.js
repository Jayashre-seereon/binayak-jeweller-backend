import * as service from "../services/gradeService.js";

// CREATE
export const createGrade = async (req, res) => {
  try {
    const { storeId } = req.query;

    const data = await service.createGradeService(
      req.body,
      Number(storeId)
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// GET GRADES BY PURITY ID
export const getGradesByPurityId = async (req, res) => {
  try {
    const { purityId } = req.params;
    const { storeId } = req.query;

    const data = await service.getGradesByPurityIdService(
      Number(purityId),
      Number(storeId)
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};
// GET
export const getGrades = async (req, res) => {
  try {
    const { storeId } = req.query;

    const data = await service.getGradesService(Number(storeId));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET BY ID
export const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    const data = await service.getGradeByIdService(Number(id), Number(storeId));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// UPDATE
export const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    const data = await service.updateGradeService(
      Number(id),
      req.body,
      Number(storeId)
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    await service.deleteGradeService(Number(id), Number(storeId));
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
