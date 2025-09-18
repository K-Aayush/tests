const BaseService = require("../patterns/BaseService");
const prisma = require("../../prisma/client");
const { createTaskSchema, updateTaskSchema } = require("../types/tasks");

/**
 * Task Service that extends BaseService
 * Implements task-specific business logic using Builder and Fetcher patterns
 */
class TaskService extends BaseService {
  constructor() {
    super("Task", prisma.task, prisma);
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>}
   */
  async createTask(taskData) {
    return await this.create(taskData, {
      validation: createTaskSchema,
      externalIdPrefix: "task",
      dateFields: ["executionPeriodStart", "executionPeriodEnd", "authoredOn"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Update a task
   * @param {string} id - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise<Object>}
   */
  async updateTask(id, taskData) {
    return await this.update(id, taskData, {
      validation: updateTaskSchema,
      dateFields: ["executionPeriodStart", "executionPeriodEnd", "authoredOn"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get task by ID
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>}
   */
  async getTaskById(id) {
    return await this.findById(id, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get task by external ID
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async getTaskByExternalId(externalId) {
    return await this.findByExternalId(externalId, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get all tasks with filtering and pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter conditions
   * @returns {Promise<{tasks: Array, pagination: Object}>}
   */
  async getAllTasks(page = 1, limit = 10, filters = {}) {
    const {
      status,
      intent,
      priority,
      requesterId,
      ownerId,
      focusId,
      focusType,
      authoredOnStart,
      authoredOnEnd,
      search,
    } = filters;

    const fetcher = this.createFetcher()
      .excludeDeleted()
      .paginate(page, limit)
      .orderBy({ authoredOn: "desc" })
      .include(this.getDefaultIncludes());

    // Apply filters
    if (status) fetcher.where({ status });
    if (intent) fetcher.where({ intent });
    if (priority) fetcher.where({ priority });
    if (requesterId) fetcher.where({ requesterId });
    if (ownerId) fetcher.where({ ownerId });
    if (focusId) fetcher.where({ focusId });
    if (focusType) fetcher.where({ focusType });

    // Date range filter
    if (authoredOnStart || authoredOnEnd) {
      fetcher.dateRange("authoredOn", authoredOnStart, authoredOnEnd);
    }

    // Search functionality
    if (search) {
      fetcher.where({
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { externalId: { contains: search, mode: "insensitive" } },
          {
            requester: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          {
            owner: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    const result = await fetcher.findMany();

    return {
      tasks: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get tasks by practitioner
   * @param {string} practitionerId - Practitioner ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{tasks: Array, pagination: Object}>}
   */
  async getTasksByPractitioner(practitionerId, page = 1, limit = 10) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({
        OR: [{ requesterId: practitionerId }, { ownerId: practitionerId }],
      })
      .paginate(page, limit)
      .orderBy({ authoredOn: "desc" })
      .include(this.getDefaultIncludes());

    const result = await fetcher.findMany();

    return {
      tasks: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Delete task (soft delete)
   * @param {string} id - Task ID
   * @returns {Promise<void>}
   */
  async deleteTask(id) {
    await this.softDelete(id);
  }

  /**
   * Restore task
   * @param {string} id - Task ID
   * @returns {Promise<void>}
   */
  async restoreTask(id) {
    await this.restore(id);
  }

  /**
   * Update task status
   * @param {string} id - Task ID
   * @param {string} status - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>}
   */
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

    return await this.prismaModel.update({
      where: { id },
      data: updateData,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Assign task to practitioner
   * @param {string} id - Task ID
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Object>}
   */
  async assignTask(id, ownerId) {
    return await this.prismaModel.update({
      where: { id },
      data: {
        ownerId,
        status: "accepted",
        lastModified: new Date(),
      },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Override getDefaultIncludes
   * @returns {Object}
   */
  getDefaultIncludes() {
    return {
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
    };
  }

  /**
   * Override getDefaultSearchFields
   * @returns {Array<string>}
   */
  getDefaultSearchFields() {
    return ["code", "description", "externalId"];
  }

  /**
   * Override getCollectionName
   * @returns {string}
   */
  getCollectionName() {
    return "tasks";
  }
}

module.exports = new TaskService();
