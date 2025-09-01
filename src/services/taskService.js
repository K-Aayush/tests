const prisma = require("../../prisma/client");
const { generatePrefixedExternalId } = require("../utils/externalId");

class TaskService {
  async createTask(taskData) {
    const {
      executionPeriodStart,
      executionPeriodEnd,
      authoredOn,
      ...taskFields
    } = taskData;

    // Generate external ID if not provided
    if (!taskFields.externalId) {
      taskFields.externalId = generatePrefixedExternalId("task");
    }

    // Convert string dates to Date objects
    const taskWithDates = {
      ...taskFields,
      executionPeriodStart: executionPeriodStart
        ? new Date(executionPeriodStart)
        : null,
      executionPeriodEnd: executionPeriodEnd
        ? new Date(executionPeriodEnd)
        : null,
      authoredOn: authoredOn ? new Date(authoredOn) : new Date(),
    };

    const task = await prisma.task.create({
      data: taskWithDates,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return task;
  }

  async updateTask(id, taskData) {
    const {
      executionPeriodStart,
      executionPeriodEnd,
      authoredOn,
      ...taskFields
    } = taskData;

    const updateData = { ...taskFields };

    if (executionPeriodStart) {
      updateData.executionPeriodStart = new Date(executionPeriodStart);
    }

    if (executionPeriodEnd) {
      updateData.executionPeriodEnd = new Date(executionPeriodEnd);
    }

    if (authoredOn) {
      updateData.authoredOn = new Date(authoredOn);
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return task;
  }

  async getTaskById(id) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null, // Only get non-deleted tasks
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return task;
  }

  async getTaskByExternalId(externalId) {
    const task = await prisma.task.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return task;
  }

  async getAllTasks(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null, // Only get non-deleted tasks
    };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.intent) {
      where.intent = filters.intent;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.requesterId) {
      where.requesterId = filters.requesterId;
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.focusId) {
      where.focusId = filters.focusId;
    }

    if (filters.focusType) {
      where.focusType = filters.focusType;
    }

    if (filters.authoredOnStart && filters.authoredOnEnd) {
      where.authoredOn = {
        gte: new Date(filters.authoredOnStart),
        lte: new Date(filters.authoredOnEnd),
      };
    } else if (filters.authoredOnStart) {
      where.authoredOn = {
        gte: new Date(filters.authoredOnStart),
      };
    } else if (filters.authoredOnEnd) {
      where.authoredOn = {
        lte: new Date(filters.authoredOnEnd),
      };
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { externalId: { contains: filters.search, mode: "insensitive" } },
        {
          requester: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
        {
          owner: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { authoredOn: "desc" },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTasksByPractitioner(practitionerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [{ requesterId: practitionerId }, { ownerId: practitionerId }],
      deletedAt: null,
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { authoredOn: "desc" },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteTask(id) {
    // Soft delete - set deletedAt timestamp
    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restoreTask(id) {
    // Restore soft deleted task
    await prisma.task.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async updateTaskStatus(id, status, notes = null) {
    const updateData = {
      status,
      lastModified: new Date(),
    };

    if (notes) {
      updateData.description = updateData.description
        ? `${updateData.description}\n\nStatus update: ${notes}`
        : `Status update: ${notes}`;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return task;
  }

  async assignTask(id, ownerId) {
    const task = await prisma.task.update({
      where: { id },
      data: {
        ownerId,
        status: "accepted",
        lastModified: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return task;
  }
}

module.exports = new TaskService();