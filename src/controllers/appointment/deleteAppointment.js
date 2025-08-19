const appointmentService = require("../../services/appointmentService");

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const existingAppointment = await appointmentService.getAppointmentById(id);
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointmentService.deleteAppointment(id);

    res.json({
      success: true,
      message: "Appointment soft deleted successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
    });
  }
};

module.exports = {
  deleteAppointment,
};
