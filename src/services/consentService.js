const BaseService = require("../patterns/BaseService");
const prisma = require("../../prisma/client");
const {
  createConsentSchema,
  updateConsentSchema,
} = require("../types/consent");

/**
 * Consent Service that extends BaseService
 * Implements consent-specific business logic using Builder and Fetcher patterns
 */
class ConsentService extends BaseService {
  constructor() {
    super("Consent", prisma.consent, prisma);
  }

  /**
   * Create a new consent
   * @param {Object} consentData - Consent data
   * @returns {Promise<Object>}
   */
  async createConsent(consentData) {
    return await this.create(consentData, {
      validation: createConsentSchema,
      externalIdPrefix: "consent",
      dateFields: ["dateTime", "periodStart", "periodEnd"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Update a consent
   * @param {string} id - Consent ID
   * @param {Object} consentData - Updated consent data
   * @returns {Promise<Object>}
   */
  async updateConsent(id, consentData) {
    return await this.update(id, consentData, {
      validation: updateConsentSchema,
      dateFields: ["dateTime", "periodStart", "periodEnd"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get consent by ID
   * @param {string} id - Consent ID
   * @returns {Promise<Object|null>}
   */
  async getConsentById(id) {
    return await this.findById(id, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get consent by external ID
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async getConsentByExternalId(externalId) {
    return await this.findByExternalId(externalId, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get all consents with filtering and pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter conditions
   * @returns {Promise<{consents: Array, pagination: Object}>}
   */
  async getAllConsents(page = 1, limit = 10, filters = {}) {
    const {
      status,
      category,
      patientId,
      organizationId,
      scope,
      dateTimeStart,
      dateTimeEnd,
      search,
    } = filters;

    const fetcher = this.createFetcher()
      .excludeDeleted()
      .paginate(page, limit)
      .orderBy({ dateTime: "desc" })
      .include(this.getDefaultIncludes());

    // Apply filters
    if (status) fetcher.where({ status });
    if (category) fetcher.where({ category });
    if (patientId) fetcher.where({ patientId });
    if (organizationId) fetcher.where({ organizationId });
    if (scope)
      fetcher.where({ scope: { contains: scope, mode: "insensitive" } });

    // Date range filter
    if (dateTimeStart || dateTimeEnd) {
      fetcher.dateRange("dateTime", dateTimeStart, dateTimeEnd);
    }

    // Search functionality
    if (search) {
      fetcher.where({
        OR: [
          { scope: { contains: search, mode: "insensitive" } },
          { grantedBy: { contains: search, mode: "insensitive" } },
          { externalId: { contains: search, mode: "insensitive" } },
          {
            patient: {
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
      consents: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get patient consents
   * @param {string} patientId - Patient ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{consents: Array, pagination: Object}>}
   */
  async getPatientConsents(patientId, page = 1, limit = 10) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({ patientId })
      .paginate(page, limit)
      .orderBy({ dateTime: "desc" })
      .include(this.getDefaultIncludes());

    const result = await fetcher.findMany();

    return {
      consents: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Delete consent (soft delete)
   * @param {string} id - Consent ID
   * @returns {Promise<void>}
   */
  async deleteConsent(id) {
    await this.softDelete(id);
  }

  /**
   * Restore consent
   * @param {string} id - Consent ID
   * @returns {Promise<void>}
   */
  async restoreConsent(id) {
    await this.restore(id);
  }

  /**
   * Update consent status
   * @param {string} id - Consent ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateConsentStatus(id, status) {
    return await this.prismaModel.update({
      where: { id },
      data: { status },
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Get active consents for patient
   * @param {string} patientId - Patient ID
   * @param {string} category - Category filter (optional)
   * @returns {Promise<Array>}
   */
  async getActiveConsentsForPatient(patientId, category = null) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({
        patientId,
        status: "active",
        OR: [{ periodEnd: null }, { periodEnd: { gte: new Date() } }],
      })
      .orderBy({ dateTime: "desc" })
      .include(this.getDefaultIncludes());

    if (category) {
      fetcher.where({ category });
    }

    const result = await fetcher.findMany();
    return result.data;
  }

  /**
   * Check consent for specific purpose
   * @param {string} patientId - Patient ID
   * @param {string} purpose - Purpose to check
   * @param {string} category - Category filter (optional)
   * @returns {Promise<boolean>}
   */
  async checkConsentForPurpose(patientId, purpose, category = null) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({
        patientId,
        status: "active",
        purpose: { has: purpose },
        OR: [{ periodEnd: null }, { periodEnd: { gte: new Date() } }],
      })
      .orderBy({ dateTime: "desc" });

    if (category) {
      fetcher.where({ category });
    }

    const consent = await fetcher.findFirst();
    return !!consent;
  }

  /**
   * Override getDefaultIncludes
   * @returns {Object}
   */
  getDefaultIncludes() {
    return {
      patient: {
        select: {
          id: true,
          externalId: true,
          firstName: true,
          lastName: true,
        },
      },
    };
  }

  /**
   * Override getDefaultSearchFields
   * @returns {Array<string>}
   */
  getDefaultSearchFields() {
    return ["scope", "grantedBy", "externalId"];
  }

  /**
   * Override getCollectionName
   * @returns {string}
   */
  getCollectionName() {
    return "consents";
  }
}

module.exports = new ConsentService();
