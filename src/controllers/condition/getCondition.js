const conditionService = require("../../services/conditionService");

const getCondition = async (req, res) => {
  try {
    const { id, externalId } = req.params;

    let condition;
    if (externalId) {
      condition = await conditionService.getConditionByExternalId(externalId);
    } else {
      condition = await conditionService.getConditionById(id);
    }

    if (!condition) {
      return res.status(404).json({
        success: false,
        message: "Condition not found",
      });
    }

    res.json({
      success: true,
      data: { condition },
    });
  } catch (error) {
    console.error("Get condition error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get condition",
    });
  }
};

const getAllConditions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      clinicalStatus: req.query.clinicalStatus,
      verificationStatus: req.query.verificationStatus,
      category: req.query.category,
      severity: req.query.severity,
      subjectId: req.query.subjectId,
      encounterId: req.query.encounterId,
      recordedBy: req.query.recordedBy,
      onsetStart: req.query.onsetStart,
      onsetEnd: req.query.onsetEnd,
      search: req.query.search,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await conditionService.getAllConditions(
      page,
      limit,
      filters
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all conditions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conditions",
    });
  }
};

const getPatientConditions = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await conditionService.getPatientConditions(
      patientId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get patient conditions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get patient conditions",
    });
  }
};

module.exports = {
  getCondition,
  getAllConditions,
  getPatientConditions,
};
