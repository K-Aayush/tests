const BaseService = require("../patterns/BaseService");
const prisma = require("../../prisma/client");
const {
  createPractitionerSchema,
  updatePractitionerSchema,
} = require("../types/practitioner");

/**
 * Practitioner Service that extends BaseService
 * Implements practitioner-specific business logic using Builder and Fetcher patterns
 */
class PractitionerService extends BaseService {
  constructor() {
    super("Practitioner", prisma.practitioner, prisma);
  }

  /**
   * Create a new practitioner
   * @param {Object} practitionerData - Practitioner data
   * @returns {Promise<Object>}
   */
  async createPractitioner(practitionerData) {
    return await this.create(practitionerData, {
      validation: createPractitionerSchema,
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Update a practitioner
   * @param {string} id - Practitioner ID
   * @param {Object} practitionerData - Updated practitioner data
   * @returns {Promise<Object>}
   */
  async updatePractitioner(id, practitionerData) {
    return await this.update(id, practitionerData, {
      validation: updatePractitionerSchema,
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get practitioner by ID
   * @param {string} id - Practitioner ID
   * @returns {Promise<Object|null>}
   */
  async getPractitionerById(id) {
    return await this.findById(id, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get practitioner by NPI
   * @param {string} npi - NPI number
   * @returns {Promise<Object|null>}
   */
  async getPractitionerByNPI(npi) {
    return await this.createFetcher()
      .where({ npi })
      .include(this.getDefaultIncludes())
      .findFirst();
  }

  /**
   * Get practitioner by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>}
   */
  async getPractitionerByEmail(email) {
    return await this.createFetcher().where({ email }).findFirst();
  }

  /**
   * Get all practitioners with filtering and pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter conditions
   * @returns {Promise<{practitioners: Array, pagination: Object}>}
   */
  async getAllPractitioners(page = 1, limit = 10, filters = {}) {
    const { active, specialty, organizationId, search } = filters;

    const fetcher = this.createFetcher()
      .paginate(page, limit)
      .orderBy(this.getDefaultOrderBy());

    if (active !== undefined) {
      fetcher.where({ active });
    }

    if (specialty) {
      fetcher.where({
        specialty: { contains: specialty, mode: "insensitive" },
      });
    }

    if (organizationId) {
      fetcher.where({ organizationId });
    }

    if (search) {
      fetcher.search(search, this.getDefaultSearchFields());
    }

    // Include task counts
    fetcher.include({
      _count: {
        select: {
          requestedTasks: true,
          ownedTasks: true,
        },
      },
    });

    const result = await fetcher.findMany();

    return {
      practitioners: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Delete practitioner with validation
   * @param {string} id - Practitioner ID
   * @returns {Promise<void>}
   */
  async deletePractitioner(id) {
    // Check if practitioner has active tasks
    const activeTasks = await prisma.task.count({
      where: {
        OR: [{ requesterId: id }, { ownerId: id }],
        status: {
          notIn: ["completed", "cancelled", "failed", "entered_in_error"],
        },
        deletedAt: null,
      },
    });

    if (activeTasks > 0) {
      throw new Error(
        "Cannot delete practitioner with active tasks. Please reassign or complete tasks first."
      );
    }

    // Soft delete by setting active to false
    await this.prismaModel.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * Restore practitioner
   * @param {string} id - Practitioner ID
   * @returns {Promise<void>}
   */
  async restorePractitioner(id) {
    await this.prismaModel.update({
      where: { id },
      data: { active: true },
    });
  }

  /**
   * Override getDefaultIncludes
   * @returns {Object}
   */
  getDefaultIncludes() {
    return {
      requestedTasks: {
        select: {
          id: true,
          externalId: true,
          code: true,
          status: true,
          priority: true,
        },
      },
      ownedTasks: {
        select: {
          id: true,
          externalId: true,
          code: true,
          status: true,
          priority: true,
        },
      },
    };
  }

  /**
   * Override getDefaultSearchFields
   * @returns {Array<string>}
   */
  getDefaultSearchFields() {
    return ["firstName", "lastName", "email", "npi", "specialty"];
  }

  /**
   * Override getCollectionName
   * @returns {string}
   */
  getCollectionName() {
    return "practitioners";
  }
}

module.exports = new PractitionerService();
