const consentService = require("../../services/consentService");

const getConsent = async (req, res) => {
  try {
    const { id, externalId } = req.params;

    let consent;
    if (externalId) {
      consent = await consentService.getConsentByExternalId(externalId);
    } else {
      consent = await consentService.getConsentById(id);
    }

    if (!consent) {
      return res.status(404).json({
        success: false,
        message: "Consent not found",
      });
    }

    res.json({
      success: true,
      data: { consent },
    });
  } catch (error) {
    console.error("Get consent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get consent",
    });
  }
};

const getAllConsents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      status: req.query.status,
      category: req.query.category,
      patientId: req.query.patientId,
      organizationId: req.query.organizationId,
      scope: req.query.scope,
      dateTimeStart: req.query.dateTimeStart,
      dateTimeEnd: req.query.dateTimeEnd,
      search: req.query.search,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await consentService.getAllConsents(page, limit, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all consents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get consents",
    });
  }
};

const getPatientConsents = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await consentService.getPatientConsents(
      patientId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get patient consents error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get patient consents",
    });
  }
};

const checkConsentForPurpose = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { purpose, category } = req.query;

    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: "Purpose parameter is required",
      });
    }

    const hasConsent = await consentService.checkConsentForPurpose(
      patientId,
      purpose,
      category
    );

    res.json({
      success: true,
      data: {
        hasConsent,
        purpose,
        category: category || null,
      },
    });
  } catch (error) {
    console.error("Check consent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check consent",
    });
  }
};

module.exports = {
  getConsent,
  getAllConsents,
  getPatientConsents,
  checkConsentForPurpose,
};
