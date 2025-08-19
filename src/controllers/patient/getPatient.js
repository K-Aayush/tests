const patientService = require("../../services/patientService");

const getPatient = async (req, res) => {
  try {
    const { id, externalId } = req.params;

    let patient;
    if (externalId) {
      patient = await patientService.getPatientByExternalId(externalId);
    } else {
      patient = await patientService.getPatientById(id);
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get patient",
    });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      active: req.query.active ? req.query.active === "true" : undefined,
      gender: req.query.gender,
      search: req.query.search,
    };

    const result = await patientService.getAllPatients(page, limit, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get patients",
    });
  }
};

module.exports = {
  getPatient,
  getAllPatients,
};
