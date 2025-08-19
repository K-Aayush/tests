const patientService = require("../../services/patientService");
const { createPatientSchema } = require("../../types/patient");

const createPatient = async (req, res) => {
  try {
    const validatedData = createPatientSchema.parse(req.body);
    const patient = await patientService.createPatient(validatedData);

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: { patient },
    });
  } catch (error) {
    console.error("Create patient error:", error);

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
      message: "Failed to create patient",
    });
  }
};

module.exports = { createPatient };
