const practitionerService = require("../../services/practitionerService");
const { createPractitionerSchema } = require("../../types/practitioner");

const createPractitioner = async (req, res) => {
  try {
    const validatedData = createPractitionerSchema.parse(req.body);
    const practitioner = await practitionerService.createPractitioner(
      validatedData
    );

    res.status(201).json({
      success: true,
      message: "Practitioner created successfully",
      data: { practitioner },
    });
  } catch (error) {
    console.error("Create practitioner error:", error);

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

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      return res.status(409).json({
        success: false,
        message: `${field === "npi" ? "NPI" : "Email"} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create practitioner",
    });
  }
};

module.exports = { createPractitioner };
