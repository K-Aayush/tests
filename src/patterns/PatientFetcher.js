const BaseFetcher = require("./BaseFetcher");
const prisma = require("../../prisma/client");

/**
 * Patient-specific fetcher that extends BaseFetcher
 * Handles patient-specific querying including polymorphic relations
 */
class PatientFetcher extends BaseFetcher {
  constructor() {
    super("Patient", prisma.patient);
  }

  /**
   * Override findById to include patient relations
   * @param {string} id - Patient ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const patient = await super.findById(id);
    if (!patient) return null;

    return await this.attachRelations(patient);
  }

  /**
   * Override findByExternalId to include patient relations
   * @param {string} externalId - External ID
   * @returns {Promise<Object|null>}
   */
  async findByExternalId(externalId) {
    const patient = await super.findByExternalId(externalId);
    if (!patient) return null;

    return await this.attachRelations(patient);
  }

  /**
   * Override findFirst to include patient relations
   * @returns {Promise<Object|null>}
   */
  async findFirst() {
    const patient = await super.findFirst();
    if (!patient) return null;

    return await this.attachRelations(patient);
  }

  /**
   * Override findMany to include patient relations
   * @returns {Promise<{data: Array, pagination: Object}>}
   */
  async findMany() {
    const result = await super.findMany();

    if (result.data.length > 0) {
      result.data = await Promise.all(
        result.data.map((patient) => this.attachRelations(patient))
      );
    }

    return result;
  }

  /**
   * Attach polymorphic relations to patient
   * @param {Object} patient - Patient object
   * @returns {Promise<Object>}
   */
  async attachRelations(patient) {
    const [identifiers, addresses] = await Promise.all([
      prisma.identifier.findMany({
        where: {
          identifiableId: patient.id,
          identifiableType: "Patient",
        },
      }),
      prisma.address.findMany({
        where: {
          addressableId: patient.id,
          addressableType: "Patient",
        },
      }),
    ]);

    return {
      ...patient,
      identifier: identifiers,
      address: addresses,
    };
  }

  /**
   * Add patient-specific search functionality
   * @param {string} searchTerm - Search term
   * @returns {PatientFetcher}
   */
  searchPatients(searchTerm) {
    if (searchTerm) {
      this.whereClause.OR = [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { preferredName: { contains: searchTerm, mode: "insensitive" } },
        { empi: { contains: searchTerm, mode: "insensitive" } },
        { externalId: { contains: searchTerm, mode: "insensitive" } },
      ];
    }
    return this;
  }

  /**
   * Filter by active status
   * @param {boolean} active - Active status
   * @returns {PatientFetcher}
   */
  filterByActive(active) {
    if (active !== undefined) {
      this.whereClause.active = active;
    }
    return this;
  }

  /**
   * Filter by gender
   * @param {string} gender - Gender
   * @returns {PatientFetcher}
   */
  filterByGender(gender) {
    if (gender) {
      this.whereClause.gender = gender;
    }
    return this;
  }
}

module.exports = PatientFetcher;
