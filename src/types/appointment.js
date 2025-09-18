const { z } = require("zod");

// Enums
const AppointmentStatus = z.enum([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

// Create appointment schema
const createAppointmentSchema = z
  .object({
    externalId: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.string().datetime("Invalid start time format"),
    endTime: z.string().datetime("Invalid end time format"),
    status: AppointmentStatus.default("scheduled"),
    type: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    patientId: z.string().min(1, "Patient ID is required"),
    providerId: z.string().optional(),
  })
  .refine(
    (data) => {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      return endTime > startTime;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// Update appointment schema
const updateAppointmentSchema = z
  .object({
    externalId: z.string().optional(),
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    startTime: z.string().datetime("Invalid start time format").optional(),
    endTime: z.string().datetime("Invalid end time format").optional(),
    status: AppointmentStatus.default("scheduled").optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    patientId: z.string().min(1, "Patient ID is required").optional(),
    providerId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// Appointment response schema
const appointmentResponseSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  status: AppointmentStatus,
  type: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  patientId: z.string(),
  providerId: z.string().optional(),
  patient: z
    .object({
      id: z.string(),
      externalId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      contactPointValue: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

module.exports = {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentResponseSchema,
  AppointmentStatus,
};
