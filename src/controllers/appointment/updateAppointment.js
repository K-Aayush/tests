const appointmentService = require("../../services/appointmentService");
const { updateAppointmentSchema } = require("../../types/appointment");

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateAppointmentSchema.parse(req.body);

    // Check if appointment exists
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = await appointmentService.updateAppointment(
      id,
      validatedData
    );

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: { appointment },
    });
  } catch (error) {
    console.error("Update appointment error:", error);

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
      message: "Failed to update appointment",
    });
  }
};

module.exports = {
  updateAppointment,
};
