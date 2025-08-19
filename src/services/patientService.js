const prisma = require("../../prisma/client");
const { generatePrefixedExternalId } = require("../utils/externalId");

class PatientService {
  async createPatient(patientData) {
    const { identifier, address, ...patientFields } = patientData;

    // Generate external ID if not provided
    if (!patientFields.externalId) {
      patientFields.externalId = generatePrefixedExternalId("pat");
    }

    if (patientFields.birthDate) {
      patientFields.birthDate = new Date(patientFields.birthDate);
    }

    const patient = await prisma.patient.create({
      data: patientFields,
    });

    // Create identifiers with polymorphic relation
    if (identifier && identifier.length > 0) {
      await prisma.identifier.createMany({
        data: identifier.map((id) => ({
          ...id,
          identifiableId: patient.id,
          identifiableType: "Patient",
        })),
      });
    }

    // Create addresses with polymorphic relation
    if (address && address.length > 0) {
      await prisma.address.createMany({
        data: address.map((addr) => ({
          ...addr,
          addressableId: patient.id,
          addressableType: "Patient",
        })),
      });
    }

    return this.getPatientById(patient.id);
  }

  async updatePatient(id, patientData) {
    const { identifier, address, ...patientFields } = patientData;

    if (patientFields.birthDate) {
      patientFields.birthDate = new Date(patientFields.birthDate);
    }

    // Update patient data
    const patient = await prisma.patient.update({
      where: { id },
      data: patientFields,
    });

    // Update identifiers if provided
    if (identifier) {
      // Delete existing identifiers
      await prisma.identifier.deleteMany({
        where: {
          identifiableId: id,
          identifiableType: "Patient",
        },
      });

      // Create new identifiers
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
      // Delete existing addresses
      await prisma.address.deleteMany({
        where: {
          addressableId: id,
          addressableType: "Patient",
        },
      });

      // Create new addresses
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

    return this.getPatientById(patient.id);
  }

  async getPatientById(id) {
    const patient = await prisma.patient.findFirst({
      where: {
        id,
        deletedAt: null, // Only get non-deleted patients
      },
    });

    if (!patient) return null;

    // Get identifiers and addresses separately due to polymorphic relations
    const [identifiers, addresses] = await Promise.all([
      prisma.identifier.findMany({
        where: {
          identifiableId: id,
          identifiableType: "Patient",
        },
      }),
      prisma.address.findMany({
        where: {
          addressableId: id,
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

  async getPatientByExternalId(externalId) {
    const patient = await prisma.patient.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
    });

    if (!patient) return null;

    // Get identifiers and addresses separately due to polymorphic relations
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

  async getAllPatients(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null, // Only get non-deleted patients
    };

    // Apply filters
    if (filters.active !== undefined) {
      where.active = filters.active;
    }
    if (filters.gender) {
      where.gender = filters.gender;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { preferredName: { contains: filters.search, mode: "insensitive" } },
        { empi: { contains: filters.search, mode: "insensitive" } },
        { externalId: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    // Get identifiers and addresses for each patient
    const patientsWithRelations = await Promise.all(
      patients.map(async (patient) => {
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
      })
    );

    return {
      patients: patientsWithRelations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deletePatient(id) {
    // Soft delete - set deletedAt timestamp
    await prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });
  }

  async restorePatient(id) {
    // Restore soft deleted patient
    await prisma.patient.update({
      where: { id },
      data: {
        deletedAt: null,
        active: true,
      },
    });
  }

  async permanentlyDeletePatient(id) {
    // Hard delete - only for admin use
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
}

module.exports = new PatientService();
