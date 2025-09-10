const conditionService = require("../../services/conditionService");
const { createConditionSchema } = require("../../types/condition");

const createCondition = async (req, res) => {
  try {
    const validatedData = createConditionSchema.parse(req.body);
    const condition = await conditionService.createCondition(validatedData);

    res.status(201).json({
      success: true,
      message: "Condition created successfully",
      data: { condition },
    });
  } catch (error) {
    console.error("Create condition error:", error);

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
        message: "Invalid patient ID or practitioner ID - record not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create condition",
    });
  }
};

module.exports = {
  createCondition,
};
