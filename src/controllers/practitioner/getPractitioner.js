const practitionerService = require("../../services/practitionerService");

const getPractitioner = async (req, res) => {
  try {
    const { id, npi } = req.params;

    let practitioner;
    if (npi) {
      practitioner = await practitionerService.getPractitionerByNPI(npi);
    } else {
      practitioner = await practitionerService.getPractitionerById(id);
    }

    if (!practitioner) {
      return res.status(404).json({
        success: false,
        message: "Practitioner not found",
      });
    }

    res.json({
      success: true,
      data: { practitioner },
    });
  } catch (error) {
    console.error("Get practitioner error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get practitioner",
    });
  }
};

const getAllPractitioners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      active: req.query.active ? req.query.active === "true" : undefined,
      specialty: req.query.specialty,
      organizationId: req.query.organizationId,
      search: req.query.search,
    };

    const result = await practitionerService.getAllPractitioners(
      page,
      limit,
      filters
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all practitioners error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get practitioners",
    });
  }
};

module.exports = {
  getPractitioner,
  getAllPractitioners,
};
