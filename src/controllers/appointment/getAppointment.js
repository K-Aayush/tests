const appointmentService = require("../../services/appointmentService");

const getAppointment = async (req, res) => {
  try {
    const { id, externalId } = req.params;

    let appointment;
    if (externalId) {
      appointment = await appointmentService.getAppointmentByExternalId(
        externalId
      );
    } else {
      appointment = await appointmentService.getAppointmentById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get appointment",
    });
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      status: req.query.status,
      type: req.query.type,
      patientId: req.query.patientId,
      patientExternalId: req.query.patientExternalId,
      providerId: req.query.providerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await appointmentService.getAllAppointments(
      page,
      limit,
      filters
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
    });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const { patientId, patientExternalId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let result;
    if (patientExternalId) {
      result = await appointmentService.getPatientAppointmentsByExternalId(
        patientExternalId,
        page,
        limit
      );
    } else {
      result = await appointmentService.getPatientAppointments(
        patientId,
        page,
        limit
      );
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get patient appointments",
    });
  }
};

module.exports = {
  getAppointment,
  getAllAppointments,
  getPatientAppointments,
};
