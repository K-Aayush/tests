const appointmentService = require("../../services/appointmentService");
const { createAppointmentSchema } = require("../../types/appointment");

const createAppointment = async (req, res) => {
  try {
    const validatedData = createAppointmentSchema.parse(req.body);
    const appointment = await appointmentService.createAppointment(
      validatedData
    );

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: { appointment },
    });
  } catch (error) {
    console.error("Create appointment error:", error);

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

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID - patient not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
    });
  }
};

module.exports = {
  createAppointment,
};
