const taskService = require("../../services/taskService");

const getTask = async (req, res) => {
  try {
    const { id, externalId } = req.params;

    let task;
    if (externalId) {
      task = await taskService.getTaskByExternalId(externalId);
    } else {
      task = await taskService.getTaskById(id);
    }

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get task",
    });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {
      status: req.query.status,
      intent: req.query.intent,
      priority: req.query.priority,
      requesterId: req.query.requesterId,
      ownerId: req.query.ownerId,
      focusId: req.query.focusId,
      focusType: req.query.focusType,
      authoredOnStart: req.query.authoredOnStart,
      authoredOnEnd: req.query.authoredOnEnd,
      search: req.query.search,
    };

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await taskService.getAllTasks(page, limit, filters);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tasks",
    });
  }
};

const getTasksByPractitioner = async (req, res) => {
  try {
    const { practitionerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await taskService.getTasksByPractitioner(
      practitionerId,
      page,
      limit
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get practitioner tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get practitioner tasks",
    });
  }
};

module.exports = {
  getTask,
  getAllTasks,
  getTasksByPractitioner,
};
