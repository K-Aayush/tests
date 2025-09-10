const prisma = require("../../prisma/client");
const { generatePrefixedExternalId } = require("../utils/externalId");

class ConditionService {
  async createCondition(conditionData) {
    const { onsetDateTime, recordedDate, ...conditionFields } = conditionData;

    // Generate external ID if not provided
    if (!conditionFields.externalId) {
      conditionFields.externalId = generatePrefixedExternalId("cond");
    }

    // Convert string dates to Date objects
    const conditionWithDates = {
      ...conditionFields,
      onsetDateTime: onsetDateTime ? new Date(onsetDateTime) : null,
      recordedDate: recordedDate ? new Date(recordedDate) : new Date(),
    };

    const condition = await prisma.condition.create({
      data: conditionWithDates,
      include: {
        subject: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
        recorder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return condition;
  }

  async updateCondition(id, conditionData) {
    const { onsetDateTime, recordedDate, ...conditionFields } = conditionData;

    const updateData = { ...conditionFields };

    if (onsetDateTime) {
      updateData.onsetDateTime = new Date(onsetDateTime);
    }

    if (recordedDate) {
      updateData.recordedDate = new Date(recordedDate);
    }

    const condition = await prisma.condition.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
        recorder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return condition;
  }

  async getConditionById(id) {
    const condition = await prisma.condition.findFirst({
      where: {
        id,
        deletedAt: null, // Only get non-deleted conditions
      },
      include: {
        subject: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
        recorder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return condition;
  }

  async getConditionByExternalId(externalId) {
    const condition = await prisma.condition.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
      include: {
        subject: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
        recorder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return condition;
  }

  async getAllConditions(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null, // Only get non-deleted conditions
    };

    // Apply filters
    if (filters.clinicalStatus) {
      where.clinicalStatus = filters.clinicalStatus;
    }

    if (filters.verificationStatus) {
      where.verificationStatus = filters.verificationStatus;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.encounterId) {
      where.encounterId = filters.encounterId;
    }

    if (filters.recordedBy) {
      where.recordedBy = filters.recordedBy;
    }

    if (filters.onsetStart && filters.onsetEnd) {
      where.onsetDateTime = {
        gte: new Date(filters.onsetStart),
        lte: new Date(filters.onsetEnd),
      };
    } else if (filters.onsetStart) {
      where.onsetDateTime = {
        gte: new Date(filters.onsetStart),
      };
    } else if (filters.onsetEnd) {
      where.onsetDateTime = {
        lte: new Date(filters.onsetEnd),
      };
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { codeDisplay: { contains: filters.search, mode: "insensitive" } },
        { notes: { contains: filters.search, mode: "insensitive" } },
        { externalId: { contains: filters.search, mode: "insensitive" } },
        {
          subject: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [conditions, total] = await Promise.all([
      prisma.condition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedDate: "desc" },
        include: {
          subject: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
            },
          },
          recorder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      }),
      prisma.condition.count({ where }),
    ]);

    return {
      conditions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientConditions(patientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      subjectId: patientId,
      deletedAt: null,
    };

    const [conditions, total] = await Promise.all([
      prisma.condition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedDate: "desc" },
        include: {
          subject: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
            },
          },
          recorder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      }),
      prisma.condition.count({ where }),
    ]);

    return {
      conditions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteCondition(id) {
    // Soft delete - set deletedAt timestamp
    await prisma.condition.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restoreCondition(id) {
    // Restore soft deleted condition
    await prisma.condition.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async updateConditionStatus(id, clinicalStatus, verificationStatus = null) {
    const updateData = {
      clinicalStatus,
    };

    if (verificationStatus) {
      updateData.verificationStatus = verificationStatus;
    }

    const condition = await prisma.condition.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
        recorder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    return condition;
  }
}

module.exports = new ConditionService();