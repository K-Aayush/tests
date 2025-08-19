const patientService = require("../../services/patientService");
const { updatePatientSchema } = require("../../types/patient");

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updatePatientSchema.parse(req.body);

    // Check if patient exists
    const existingPatient = await patientService.getPatientById(id);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patient = await patientService.updatePatient(id, validatedData);

    res.json({
      success: true,
      message: "Patient updated successfully",
      data: { patient },
    });
  } catch (error) {
    console.error("Update patient error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};

module.exports = {
  updatePatient,
};
