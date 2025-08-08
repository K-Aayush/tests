const patientService = require("../../services/patientService");
const {
  createPatientSchema,
  updatePatientSchema,
} = require("../../types/patient");

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

const getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientById(id);

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

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if patient exists
    const existingPatient = await patientService.getPatientById(id);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    await patientService.deletePatient(id);

    res.json({
      success: true,
      message: "Patient soft deleted successfully",
    });
  } catch (error) {
    console.error("Delete patient error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete patient",
    });
  }
};

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
  createPatient,
  updatePatient,
  getPatient,
  getAllPatients,
  deletePatient,
  restorePatient,
};
