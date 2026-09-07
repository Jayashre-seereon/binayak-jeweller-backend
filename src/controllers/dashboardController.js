import { getDashboardSummaryService } from "../services/dashboardService.js";

export const getDashboardSummaryController = async (req, res) => {
  try {
    const storeId = req.user?.storeId || req.query.storeId || 1;
    const period = req.query.period || "this_month";

    const data = await getDashboardSummaryService(storeId, period);

    res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Dashboard Controller Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard summary",
    });
  }
};
