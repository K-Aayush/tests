const BaseService = require("../patterns/BaseService");
const prisma = require("../../prisma/client");
const {
  createUserEntityLinkSchema,
  updateUserEntityLinkSchema,
} = require("../types/userEntityLink");

/**
 * UserEntityLink Service that extends BaseService
 * Manages relationships between users and entities (patients, practitioners, organizations)
 */
class UserEntityLinkService extends BaseService {
  constructor() {
    super("UserEntityLink", prisma.userEntityLink, prisma);
  }

  /**
   * Create a new user entity link
   * @param {Object} linkData - Link data
   * @returns {Promise<Object>}
   */
  async createUserEntityLink(linkData) {
    return await this.create(linkData, {
      validation: createUserEntityLinkSchema,
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Update an existing user entity link
   * @param {string} id - Link ID
   * @param {Object} linkData - Updated link data
   * @returns {Promise<Object>}
   */
  async updateUserEntityLink(id, linkData) {
    const validatedData = updateUserEntityLinkSchema.parse(linkData);

    return await this.update(id, validatedData, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get user entity links by user ID
   * @param {string} userId - User ID
   * @param {string} entityType - Optional entity type filter
   * @returns {Promise<Array>}
   */
  async getUserEntityLinks(userId, entityType = null) {
    const fetcher = this.createFetcher()
      .where({ userId })
      .include(this.getDefaultIncludes())
      .orderBy({ createdAt: "desc" });

    if (entityType) {
      fetcher.where({ entityType });
    }

    const result = await fetcher.findMany();
    return result.data;
  }

  /**
   * Get entity links by entity ID and type
   * @param {string} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<Array>}
   */
  async getEntityLinks(entityId, entityType) {
    const fetcher = this.createFetcher()
      .where({ entityId, entityType })
      .include(this.getDefaultIncludes())
      .orderBy({ createdAt: "desc" });

    const result = await fetcher.findMany();
    return result.data;
  }

  /**
   * Check if user is linked to entity
   * @param {string} userId - User ID
   * @param {string} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<boolean>}
   */
  async isUserLinkedToEntity(userId, entityId, entityType) {
    const link = await this.createFetcher()
      .where({ userId, entityId, entityType })
      .findFirst();

    return !!link;
  }

  /**
   * Get user's patient record
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getUserPatient(userId) {
    const link = await this.createFetcher()
      .where({ userId, entityType: "PATIENT" })
      .findFirst();

    if (!link) return null;

    // Get the actual patient record
    return await prisma.patient.findUnique({
      where: { id: link.entityId },
      include: {
        identifier: true,
        address: true,
      },
    });
  }

  /**
   * Get user's practitioner record
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async getUserPractitioner(userId) {
    const link = await this.createFetcher()
      .where({ userId, entityType: "PRACTITIONER" })
      .findFirst();

    if (!link) return null;

    // Get the actual practitioner record
    return await prisma.practitioner.findUnique({
      where: { id: link.entityId },
    });
  }

  /**
   * Delete user entity link
   * @param {string} userId - User ID
   * @param {string} entityId - Entity ID
   * @param {string} entityType - Entity type
   * @returns {Promise<void>}
   */
  async deleteUserEntityLink(userId, entityId, entityType) {
    await this.prismaModel.deleteMany({
      where: { userId, entityId, entityType },
    });
  }

  /**
   * Override getDefaultIncludes
   * @returns {Object}
   */
  getDefaultIncludes() {
    return {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isEmailVerified: true,
        },
      },
    };
  }

  /**
   * Override getCollectionName
   * @returns {string}
   */
  getCollectionName() {
    return "userEntityLinks";
  }
}

module.exports = new UserEntityLinkService();
