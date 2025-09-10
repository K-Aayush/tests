const prisma = require("../../prisma/client");
const { generatePrefixedExternalId } = require("../utils/externalId");

class ConsentService {
  async createConsent(consentData) {
    const { dateTime, periodStart, periodEnd, ...consentFields } = consentData;

    // Generate external ID if not provided
    if (!consentFields.externalId) {
      consentFields.externalId = generatePrefixedExternalId("consent");
    }

    // Convert string dates to Date objects
    const consentWithDates = {
      ...consentFields,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      periodStart: periodStart ? new Date(periodStart) : null,
      periodEnd: periodEnd ? new Date(periodEnd) : null,
    };

    const consent = await prisma.consent.create({
      data: consentWithDates,
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return consent;
  }

  async updateConsent(id, consentData) {
    const { dateTime, periodStart, periodEnd, ...consentFields } = consentData;

    const updateData = { ...consentFields };

    if (dateTime) {
      updateData.dateTime = new Date(dateTime);
    }

    if (periodStart) {
      updateData.periodStart = new Date(periodStart);
    }

    if (periodEnd) {
      updateData.periodEnd = new Date(periodEnd);
    }

    const consent = await prisma.consent.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return consent;
  }

  async getConsentById(id) {
    const consent = await prisma.consent.findFirst({
      where: {
        id,
        deletedAt: null, // Only get non-deleted consents
      },
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return consent;
  }

  async getConsentByExternalId(externalId) {
    const consent = await prisma.consent.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return consent;
  }

  async getAllConsents(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null, // Only get non-deleted consents
    };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.scope) {
      where.scope = { contains: filters.scope, mode: "insensitive" };
    }

    if (filters.dateTimeStart && filters.dateTimeEnd) {
      where.dateTime = {
        gte: new Date(filters.dateTimeStart),
        lte: new Date(filters.dateTimeEnd),
      };
    } else if (filters.dateTimeStart) {
      where.dateTime = {
        gte: new Date(filters.dateTimeStart),
      };
    } else if (filters.dateTimeEnd) {
      where.dateTime = {
        lte: new Date(filters.dateTimeEnd),
      };
    }

    if (filters.search) {
      where.OR = [
        { scope: { contains: filters.search, mode: "insensitive" } },
        { grantedBy: { contains: filters.search, mode: "insensitive" } },
        { externalId: { contains: filters.search, mode: "insensitive" } },
        {
          patient: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [consents, total] = await Promise.all([
      prisma.consent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateTime: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.consent.count({ where }),
    ]);

    return {
      consents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientConsents(patientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      patientId,
      deletedAt: null,
    };

    const [consents, total] = await Promise.all([
      prisma.consent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateTime: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.consent.count({ where }),
    ]);

    return {
      consents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteConsent(id) {
    // Soft delete - set deletedAt timestamp
    await prisma.consent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restoreConsent(id) {
    // Restore soft deleted consent
    await prisma.consent.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async updateConsentStatus(id, status) {
    const consent = await prisma.consent.update({
      where: { id },
      data: {
        status,
      },
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return consent;
  }

  async getActiveConsentsForPatient(patientId, category = null) {
    const where = {
      patientId,
      status: "active",
      deletedAt: null,
      OR: [{ periodEnd: null }, { periodEnd: { gte: new Date() } }],
    };

    if (category) {
      where.category = category;
    }

    const consents = await prisma.consent.findMany({
      where,
      orderBy: { dateTime: "desc" },
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return consents;
  }

  async checkConsentForPurpose(patientId, purpose, category = null) {
    const where = {
      patientId,
      status: "active",
      deletedAt: null,
      purpose: {
        has: purpose,
      },
      OR: [{ periodEnd: null }, { periodEnd: { gte: new Date() } }],
    };

    if (category) {
      where.category = category;
    }

    const consent = await prisma.consent.findFirst({
      where,
      orderBy: { dateTime: "desc" },
    });

    return !!consent;
  }
}

module.exports = new ConsentService();
