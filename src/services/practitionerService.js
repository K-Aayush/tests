const prisma = require("../../prisma/client");

class PractitionerService {
  async createPractitioner(practitionerData) {
    const practitioner = await prisma.practitioner.create({
      data: practitionerData,
    });

    return practitioner;
  }

  async updatePractitioner(id, practitionerData) {
    const practitioner = await prisma.practitioner.update({
      where: { id },
      data: practitionerData,
    });

    return practitioner;
  }

  async getPractitionerById(id) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { id },
      include: {
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
      },
    });

    return practitioner;
  }

  async getPractitionerByNPI(npi) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { npi },
      include: {
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
      },
    });

    return practitioner;
  }

  async getPractitionerByEmail(email) {
    const practitioner = await prisma.practitioner.findUnique({
      where: { email },
    });

    return practitioner;
  }

  async getAllPractitioners(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {};

    // Apply filters
    if (filters.active !== undefined) {
      where.active = filters.active;
    }
    if (filters.specialty) {
      where.specialty = { contains: filters.specialty, mode: "insensitive" };
    }
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { npi: { contains: filters.search, mode: "insensitive" } },
        { specialty: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [practitioners, total] = await Promise.all([
      prisma.practitioner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              requestedTasks: true,
              ownedTasks: true,
            },
          },
        },
      }),
      prisma.practitioner.count({ where }),
    ]);

    return {
      practitioners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

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
    await prisma.practitioner.update({
      where: { id },
      data: { active: false },
    });
  }

  async restorePractitioner(id) {
    await prisma.practitioner.update({
      where: { id },
      data: { active: true },
    });
  }
}

module.exports = new PractitionerService();
