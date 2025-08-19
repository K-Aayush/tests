const appointmentService = require("../../services/appointmentService");

const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Check if appointment exists
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = await appointmentService.completeAppointment(id, notes);

    res.json({
      success: true,
      message: "Appointment completed successfully",
      data: { appointment },
    });
  } catch (error) {
    console.error("Complete appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete appointment",
    });
  }
};

module.exports = {
  completeAppointment,
};
