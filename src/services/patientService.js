const BaseService = require("../patterns/BaseService");
const PatientBuilder = require("../patterns/PatientBuilder");
const PatientFetcher = require("../patterns/PatientFetcher");
const prisma = require("../../prisma/client");
const {
  createPatientSchema,
  updatePatientSchema,
} = require("../types/patient");

/**
 * Patient Service that extends BaseService
 * Implements patient-specific business logic using Builder and Fetcher patterns
 */
class PatientService extends BaseService {
  constructor() {
    super("Patient", prisma.patient, prisma);
  }

  /**
   * Override createBuilder to return PatientBuilder
   * @returns {PatientBuilder}
   */
  createBuilder() {
    return new PatientBuilder();
  }

  /**
   * Override createFetcher to return PatientFetcher
   * @returns {PatientFetcher}
   */
  createFetcher() {
    return new PatientFetcher();
  }

  /**
   * Create a new patient
   * @param {Object} patientData - Patient data
   * @returns {Promise<Object>}
   */
  async createPatient(patientData) {
    const { identifier, address, ...patientFields } = patientData;

    const builder = this.createBuilder()
      .withData(patientFields)
      .withValidation(createPatientSchema)
      .withExternalId("pat")
      .withIdentifiers(identifier)
      .withAddresses(address);

    return await builder.build();
  }

  /**
   * Update a patient
   * @param {string} id - Patient ID
   * @param {Object} patientData - Updated patient data
   * @returns {Promise<Object>}
   */
  async updatePatient(id, patientData) {
    const { identifier, address, ...patientFields } = patientData;

    // Validate the update data
    updatePatientSchema.parse(patientData);

    // Transform birthDate if present
    if (patientFields.birthDate) {
      patientFields.birthDate = new Date(patientFields.birthDate);
    }

    // Update patient data
    const patient = await this.prismaModel.update({
      where: { id },
      data: patientFields,
    });

    // Update identifiers if provided
    if (identifier) {
      await prisma.identifier.deleteMany({
        where: {
          identifiableId: id,
          identifiableType: "Patient",
        },
      });

      if (identifier.length > 0) {
        await prisma.identifier.createMany({
          data: identifier.map((id) => ({
            ...id,
            identifiableId: patient.id,
            identifiableType: "Patient",
          })),
        });
      }
    }

    // Update addresses if provided
    if (address) {
      await prisma.address.deleteMany({
        where: {
          addressableId: id,
          addressableType: "Patient",
        },
      });

      if (address.length > 0) {
        await prisma.address.createMany({
          data: address.map((addr) => ({
            ...addr,
            addressableId: patient.id,
            addressableType: "Patient",
          })),
        });
      }
    }

    return await this.getPatientById(patient.id);
  }

  /**
   * Get patient by ID
   * @param {string} id - Patient ID
   * @returns {Promise<Object|null>}
   */
  async getPatientById(id) {
    return await this.createFetcher().excludeDeleted().findById(id);
  }

  /**
   * Get patient by external ID
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async getPatientByExternalId(externalId) {
    return await this.createFetcher()
      .excludeDeleted()
      .findByExternalId(externalId);
  }

  /**
   * Get all patients with filtering and pagination
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {Object} filters - Filter conditions
   * @returns {Promise<{patients: Array, pagination: Object}>}
   */
  async getAllPatients(page = 1, limit = 10, filters = {}) {
    const { active, gender, search } = filters;

    const fetcher = this.createFetcher()
      .excludeDeleted()
      .paginate(page, limit)
      .orderBy({ createdAt: "desc" });

    if (active !== undefined) {
      fetcher.filterByActive(active);
    }

    if (gender) {
      fetcher.filterByGender(gender);
    }

    if (search) {
      fetcher.searchPatients(search);
    }

    const result = await fetcher.findMany();

    return {
      patients: result.data,
      pagination: result.pagination,
    };
  }

  /**
   * Delete patient (soft delete)
   * @param {string} id - Patient ID
   * @returns {Promise<void>}
   */
  async deletePatient(id) {
    await this.prismaModel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  }

  /**
   * Restore patient
   * @param {string} id - Patient ID
   * @returns {Promise<void>}
   */
  async restorePatient(id) {
    await this.prismaModel.update({
      where: { id },
      data: {
        deletedAt: null,
        active: true,
      },
    });
  }

  /**
   * Permanently delete patient (hard delete)
   * @param {string} id - Patient ID
   * @returns {Promise<void>}
   */
  async permanentlyDeletePatient(id) {
    await prisma.$transaction([
      prisma.identifier.deleteMany({
        where: {
          identifiableId: id,
          identifiableType: "Patient",
        },
      }),
      prisma.address.deleteMany({
        where: {
          addressableId: id,
          addressableType: "Patient",
        },
      }),
      prisma.patient.delete({
        where: { id },
      }),
    ]);
  }

  /**
   * Override getDefaultSearchFields
   * @returns {Array<string>}
   */
  getDefaultSearchFields() {
    return ["firstName", "lastName", "preferredName", "empi", "externalId"];
  }
}

module.exports = new PatientService();
