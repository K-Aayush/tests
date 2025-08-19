const appointmentService = require("../../services/appointmentService");

const restoreAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    await appointmentService.restoreAppointment(id);

    res.json({
      success: true,
      message: "Appointment restored successfully",
    });
  } catch (error) {
    console.error("Restore appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore appointment",
    });
  }
};

module.exports = {
  restoreAppointment,
};
