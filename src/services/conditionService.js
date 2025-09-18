const BaseService = require("../patterns/BaseService");
const prisma = require("../../prisma/client");
const {
  createConditionSchema,
  updateConditionSchema,
} = require("../types/condition");

/**
 * Condition Service that extends BaseService
 * Implements condition-specific business logic using Builder and Fetcher patterns
 */
class ConditionService extends BaseService {
  constructor() {
    super("Condition", prisma.condition, prisma);
  }

  /**
   * Create a new condition
   * @param {Object} conditionData - Condition data
   * @returns {Promise<Object>}
   */
  async createCondition(conditionData) {
    return await this.create(conditionData, {
      validation: createConditionSchema,
      externalIdPrefix: "cond",
      dateFields: ["onsetDateTime", "recordedDate"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Update a condition
   * @param {string} id - Condition ID
   * @param {Object} conditionData - Updated condition data
   * @returns {Promise<Object>}
   */
  async updateCondition(id, conditionData) {
    return await this.update(id, conditionData, {
      validation: updateConditionSchema,
      dateFields: ["onsetDateTime", "recordedDate"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get condition by ID
   * @param {string} id - Condition ID
   * @returns {Promise<Object|null>}
   */
  async getConditionById(id) {
    return await this.findById(id, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get condition by external ID
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async getConditionByExternalId(externalId) {
    return await this.findByExternalId(externalId, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get all conditions with filtering and pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter conditions
   * @returns {Promise<{conditions: Array, pagination: Object}>}
   */
  async getAllConditions(page = 1, limit = 10, filters = {}) {
    const {
      clinicalStatus,
      verificationStatus,
      category,
      severity,
      subjectId,
      encounterId,
      recordedBy,
      onsetStart,
      onsetEnd,
      search,
    } = filters;

    const fetcher = this.createFetcher()
      .excludeDeleted()
      .paginate(page, limit)
      .orderBy({ recordedDate: "desc" })
      .include(this.getDefaultIncludes());

    // Apply filters
    if (clinicalStatus) fetcher.where({ clinicalStatus });
    if (verificationStatus) fetcher.where({ verificationStatus });
    if (category) fetcher.where({ category });
    if (severity) fetcher.where({ severity });
    if (subjectId) fetcher.where({ subjectId });
    if (encounterId) fetcher.where({ encounterId });
    if (recordedBy) fetcher.where({ recordedBy });

    // Date range filter for onset
    if (onsetStart || onsetEnd) {
      fetcher.dateRange("onsetDateTime", onsetStart, onsetEnd);
    }

    // Search functionality
    if (search) {
      fetcher.where({
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { codeDisplay: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { externalId: { contains: search, mode: "insensitive" } },
          {
            subject: {
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
      conditions: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get patient conditions
   * @param {string} patientId - Patient ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{conditions: Array, pagination: Object}>}
   */
  async getPatientConditions(patientId, page = 1, limit = 10) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({ subjectId: patientId })
      .paginate(page, limit)
      .orderBy({ recordedDate: "desc" })
      .include(this.getDefaultIncludes());

    const result = await fetcher.findMany();

    return {
      conditions: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Delete condition (soft delete)
   * @param {string} id - Condition ID
   * @returns {Promise<void>}
   */
  async deleteCondition(id) {
    await this.softDelete(id);
  }

  /**
   * Restore condition
   * @param {string} id - Condition ID
   * @returns {Promise<void>}
   */
  async restoreCondition(id) {
    await this.restore(id);
  }

  /**
   * Update condition status
   * @param {string} id - Condition ID
   * @param {string} clinicalStatus - Clinical status
   * @param {string} verificationStatus - Verification status (optional)
   * @returns {Promise<Object>}
   */
  async updateConditionStatus(id, clinicalStatus, verificationStatus = null) {
    const updateData = {
      clinicalStatus,
    };

    if (verificationStatus) {
      updateData.verificationStatus = verificationStatus;
    }

    return await this.prismaModel.update({
      where: { id },
      data: updateData,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Override getDefaultIncludes
   * @returns {Object}
   */
  getDefaultIncludes() {
    return {
      subject: {
        select: {
          id: true,
          externalId: true,
          firstName: true,
          lastName: true,
        },
      },
      recorder: {
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
    return ["code", "codeDisplay", "notes", "externalId"];
  }

  /**
   * Override getCollectionName
   * @returns {string}
   */
  getCollectionName() {
    return "conditions";
  }
}

module.exports = new ConditionService();
