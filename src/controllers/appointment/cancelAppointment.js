const appointmentService = require("../../services/appointmentService");

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if appointment exists
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = await appointmentService.cancelAppointment(id, reason);

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: { appointment },
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
    });
  }
};

module.exports = {
  cancelAppointment,
};
