const prisma = require("../../prisma/client");
const { generatePrefixedExternalId } = require("../utils/externalId");

class AppointmentService {
  async createAppointment(appointmentData) {
    const { startTime, endTime, ...appointmentFields } = appointmentData;

    // Generate external ID if not provided
    if (!appointmentFields.externalId) {
      appointmentFields.externalId = generatePrefixedExternalId("apt");
    }

    // Convert string dates to Date objects
    const appointmentWithDates = {
      ...appointmentFields,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };

    const appointment = await prisma.appointment.create({
      data: appointmentWithDates,
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
            contactPointValue: true,
          },
        },
      },
    });

    return appointment;
  }

  async updateAppointment(id, appointmentData) {
    const { startTime, endTime, ...appointmentFields } = appointmentData;

    const updateData = { ...appointmentFields };

    if (startTime) {
      updateData.startTime = new Date(startTime);
    }

    if (endTime) {
      updateData.endTime = new Date(endTime);
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
            contactPointValue: true,
          },
        },
      },
    });

    return appointment;
  }

  async getAppointmentById(id) {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        deletedAt: null, // Only get non-deleted appointments
      },
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
            contactPointValue: true,
          },
        },
      },
    });

    return appointment;
  }

  async getAppointmentByExternalId(externalId) {
    const appointment = await prisma.appointment.findFirst({
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
            contactPointValue: true,
          },
        },
      },
    });

    return appointment;
  }

  async getAllAppointments(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;
    const where = {
      deletedAt: null, // Only get non-deleted appointments
    };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.patientExternalId) {
      where.patient = {
        externalId: filters.patientExternalId,
      };
    }

    if (filters.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters.startDate && filters.endDate) {
      where.startTime = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters.startDate) {
      where.startTime = {
        gte: new Date(filters.startDate),
      };
    } else if (filters.endDate) {
      where.startTime = {
        lte: new Date(filters.endDate),
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
        { externalId: { contains: filters.search, mode: "insensitive" } },
        {
          patient: {
            OR: [
              { firstName: { contains: filters.search, mode: "insensitive" } },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { externalId: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: "asc" },
        include: {
          patient: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
              contactPointValue: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientAppointments(patientId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      patientId,
      deletedAt: null,
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
              contactPointValue: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientAppointmentsByExternalId(
    patientExternalId,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const where = {
      patient: {
        externalId: patientExternalId,
      },
      deletedAt: null,
    };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startTime: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              externalId: true,
              firstName: true,
              lastName: true,
              contactPointValue: true,
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteAppointment(id) {
    // Soft delete - set deletedAt timestamp
    await prisma.appointment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restoreAppointment(id) {
    // Restore soft deleted appointment
    await prisma.appointment.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async cancelAppointment(id, reason = null) {
    const updateData = {
      status: "cancelled",
    };

    if (reason) {
      updateData.notes = updateData.notes
        ? `${updateData.notes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
            contactPointValue: true,
          },
        },
      },
    });

    return appointment;
  }

  async completeAppointment(id, notes = null) {
    const updateData = {
      status: "completed",
    };

    if (notes) {
      updateData.notes = updateData.notes
        ? `${updateData.notes}\n\nCompletion notes: ${notes}`
        : `Completion notes: ${notes}`;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            externalId: true,
            firstName: true,
            lastName: true,
            contactPointValue: true,
          },
        },
      },
    });

    return appointment;
  }
}

module.exports = new AppointmentService();
