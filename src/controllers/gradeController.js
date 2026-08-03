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

    const data = await service.getGradeByIdService(Number(id));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// UPDATE
export const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await service.updateGradeService(
      Number(id),
      req.body
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

    await service.deleteGradeService(Number(id));
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};