const BaseService = require("../patterns/BaseService");
const prisma = require("../../prisma/client");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("../types/appointment");

/**
 * Appointment Service that extends BaseService
 * Implements appointment-specific business logic using Builder and Fetcher patterns
 */
class AppointmentService extends BaseService {
  constructor() {
    super("Appointment", prisma.appointment, prisma);
  }

  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>}
   */
  async createAppointment(appointmentData) {
    return await this.create(appointmentData, {
      validation: createAppointmentSchema,
      externalIdPrefix: "apt",
      dateFields: ["startTime", "endTime"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Update an appointment
   * @param {string} id - Appointment ID
   * @param {Object} appointmentData - Updated appointment data
   * @returns {Promise<Object>}
   */
  async updateAppointment(id, appointmentData) {
    return await this.update(id, appointmentData, {
      validation: updateAppointmentSchema,
      dateFields: ["startTime", "endTime"],
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get appointment by ID
   * @param {string} id - Appointment ID
   * @returns {Promise<Object|null>}
   */
  async getAppointmentById(id) {
    return await this.findById(id, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get appointment by external ID
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async getAppointmentByExternalId(externalId) {
    return await this.findByExternalId(externalId, {
      includes: this.getDefaultIncludes(),
    });
  }

  /**
   * Get all appointments with filtering and pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter conditions
   * @returns {Promise<{appointments: Array, pagination: Object}>}
   */
  async getAllAppointments(page = 1, limit = 10, filters = {}) {
    const {
      status,
      type,
      patientId,
      patientExternalId,
      providerId,
      startDate,
      endDate,
      search,
    } = filters;

    const fetcher = this.createFetcher()
      .excludeDeleted()
      .paginate(page, limit)
      .orderBy({ startTime: "asc" })
      .include(this.getDefaultIncludes());

    // Apply filters
    if (status) fetcher.where({ status });
    if (type) fetcher.where({ type });
    if (patientId) fetcher.where({ patientId });
    if (providerId) fetcher.where({ providerId });

    if (patientExternalId) {
      fetcher.where({
        patient: {
          externalId: patientExternalId,
        },
      });
    }

    // Date range filter
    if (startDate || endDate) {
      fetcher.dateRange("startTime", startDate, endDate);
    }

    // Search functionality
    if (search) {
      fetcher.where({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { externalId: { contains: search, mode: "insensitive" } },
          {
            patient: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { externalId: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    const result = await fetcher.findMany();

    return {
      appointments: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get patient appointments
   * @param {string} patientId - Patient ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{appointments: Array, pagination: Object}>}
   */
  async getPatientAppointments(patientId, page = 1, limit = 10) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({ patientId })
      .paginate(page, limit)
      .orderBy({ startTime: "desc" })
      .include(this.getDefaultIncludes());

    const result = await fetcher.findMany();

    return {
      appointments: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Get patient appointments by external ID
   * @param {string} patientExternalId - Patient external ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<{appointments: Array, pagination: Object}>}
   */
  async getPatientAppointmentsByExternalId(
    patientExternalId,
    page = 1,
    limit = 10
  ) {
    const fetcher = this.createFetcher()
      .excludeDeleted()
      .where({
        patient: {
          externalId: patientExternalId,
        },
      })
      .paginate(page, limit)
      .orderBy({ startTime: "desc" })
      .include(this.getDefaultIncludes());

    const result = await fetcher.findMany();

    return {
      appointments: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Delete appointment (soft delete)
   * @param {string} id - Appointment ID
   * @returns {Promise<void>}
   */
  async deleteAppointment(id) {
    await this.softDelete(id);
  }

  /**
   * Restore appointment
   * @param {string} id - Appointment ID
   * @returns {Promise<void>}
   */
  async restoreAppointment(id) {
    await this.restore(id);
  }

  /**
   * Cancel appointment
   * @param {string} id - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>}
   */
  async cancelAppointment(id, reason = null) {
    const updateData = {
      status: "cancelled",
    };

    if (reason) {
      updateData.notes = updateData.notes
        ? `${updateData.notes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }

    return await this.prismaModel.update({
      where: { id },
      data: updateData,
      include: this.getDefaultIncludes(),
    });
  }

  /**
   * Complete appointment
   * @param {string} id - Appointment ID
   * @param {string} notes - Completion notes
   * @returns {Promise<Object>}
   */
  async completeAppointment(id, notes = null) {
    const updateData = {
      status: "completed",
    };

    if (notes) {
      updateData.notes = updateData.notes
        ? `${updateData.notes}\n\nCompletion notes: ${notes}`
        : `Completion notes: ${notes}`;
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
      patient: {
        select: {
          id: true,
          externalId: true,
          firstName: true,
          lastName: true,
          contactPointValue: true,
        },
      },
    };
  }

  /**
   * Override getDefaultSearchFields
   * @returns {Array<string>}
   */
  getDefaultSearchFields() {
    return ["title", "description", "location", "externalId"];
  }

  /**
   * Override getCollectionName
   * @returns {string}
   */
  getCollectionName() {
    return "appointments";
  }
}

module.exports = new AppointmentService();
