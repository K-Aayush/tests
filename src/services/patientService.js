const prisma = require("../../prisma/client");

class PatientService {
  async createPatient(patientData) {
    const { identifier, address, ...patientFields } = patientData;

    if (patientFields.birthDate) {
      patientFields.birthDate = new Date(patientFields.birthDate);
    }

    const patient = await prisma.patient.create({
      data: {
        ...patientFields,
        identifier: identifier
          ? {
              create: identifier,
            }
          : undefined,
        address: address
          ? {
              create: address,
            }
          : undefined,
      },
      include: {
        identifier: true,
        address: true,
      },
    });

    return patient;
  }

  async updatePatient(id, patientData) {
    const { identifier, address, ...patientFields } = patientData;

    if (patientFields.birthDate) {
      patientFields.birthDate = new Date(patientFields.birthDate);
    }

    let identifierUpdate = undefined;
    if (identifier) {
      await prisma.identifier.deleteMany({
        where: { patientId: id },
      });
      identifierUpdate = {
        create: identifier,
      };
    }

    let addressUpdate = undefined;
    if (address) {
      await prisma.address.deleteMany({
        where: { patientId: id },
      });
      addressUpdate = {
        create: address,
      };
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...patientFields,
        identifier: identifierUpdate,
        address: addressUpdate,
      },
      include: {
        identifier: true,
        address: true,
      },
    });

    return patient;
  }

  async getPatientById(id) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        identifier: true,
        address: true,
      },
    });

    return patient;
  }

  async getAllPatients(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

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
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: {
          identifier: true,
          address: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deletePatient(id) {
    await prisma.patient.delete({
      where: { id },
    });
  }
}

module.exports = new PatientService();
