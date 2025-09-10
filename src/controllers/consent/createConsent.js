const consentService = require("../../services/consentService");
const { createConsentSchema } = require("../../types/consent");

const createConsent = async (req, res) => {
  try {
    const validatedData = createConsentSchema.parse(req.body);
    const consent = await consentService.createConsent(validatedData);

    res.status(201).json({
      success: true,
      message: "Consent created successfully",
      data: { consent },
    });
  } catch (error) {
    console.error("Create consent error:", error);

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
      message: "Failed to create consent",
    });
  }
};

module.exports = {
  createConsent,
};
