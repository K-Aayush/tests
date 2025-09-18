const BaseBuilder = require("./BaseBuilder");
const prisma = require("../../prisma/client");

/**
 * Patient-specific builder that extends BaseBuilder
 * Handles patient-specific creation logic including identifiers and addresses
 */
class PatientBuilder extends BaseBuilder {
  constructor() {
    super("Patient", prisma.patient);
    this.identifiers = [];
    this.addresses = [];
  }

  /**
   * Add identifiers to the patient
   * @param {Array} identifiers - Array of identifier objects
   * @returns {PatientBuilder}
   */
  withIdentifiers(identifiers) {
    this.identifiers = identifiers || [];
    return this;
  }

  /**
   * Add addresses to the patient
   * @param {Array} addresses - Array of address objects
   * @returns {PatientBuilder}
   */
  withAddresses(addresses) {
    this.addresses = addresses || [];
    return this;
  }

  /**
   * Override build method to handle patient-specific creation
   * @returns {Promise<Object>} Created patient with relations
   */
  async build() {
    this.validate();

    // Prepare patient data
    const patientData = this.prepareCreateData();

    // Create patient first
    const patient = await this.prismaModel.create({
      data: patientData,
    });

    // Create identifiers with polymorphic relation
    if (this.identifiers.length > 0) {
      await prisma.identifier.createMany({
        data: this.identifiers.map((identifier) => ({
          ...identifier,
          identifiableId: patient.id,
          identifiableType: "Patient",
        })),
      });
    }

    // Create addresses with polymorphic relation
    if (this.addresses.length > 0) {
      await prisma.address.createMany({
        data: this.addresses.map((address) => ({
          ...address,
          addressableId: patient.id,
          addressableType: "Patient",
        })),
      });
    }

    // Return patient with relations
    return await this.getPatientWithRelations(patient.id);
  }

  /**
   * Get patient with all relations
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>}
   */
  async getPatientWithRelations(patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    const [identifiers, addresses] = await Promise.all([
      prisma.identifier.findMany({
        where: {
          identifiableId: patientId,
          identifiableType: "Patient",
        },
      }),
      prisma.address.findMany({
        where: {
          addressableId: patientId,
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
   * Override prepareCreateData to handle date transformation
   * @returns {Object}
   */
  prepareCreateData() {
    const data = { ...this.data };

    // Transform birthDate if present
    if (data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    }

    // Remove identifiers and addresses from main data
    delete data.identifier;
    delete data.address;

    return data;
  }
}

module.exports = PatientBuilder;
