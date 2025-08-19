const patientService = require("../../services/patientService");

const restorePatient = async (req, res) => {
  try {
    const { id } = req.params;

    await patientService.restorePatient(id);

    res.json({
      success: true,
      message: "Patient restored successfully",
    });
  } catch (error) {
    console.error("Restore patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore patient",
    });
  }
};
module.exports = {
  restorePatient,
};
