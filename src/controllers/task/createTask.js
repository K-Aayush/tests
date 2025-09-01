const taskService = require("../../services/taskService");
const { createTaskSchema } = require("../../types/tasks");

const createTask = async (req, res) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(validatedData);

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task },
    });
  } catch (error) {
    console.error("Create task error:", error);

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
        message: "Invalid practitioner ID - practitioner not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
};

module.exports = {
  createTask,
};
