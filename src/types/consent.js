const { z } = require("zod");

// Enums
const ConsentStatus = z.enum([
  "draft",
  "proposed",
  "active",
  "rejected",
  "inactive",
  "entered_in_error",
]);

const ConsentCategory = z.enum([
  "privacy",
  "treatment",
  "research",
  "advance_directive",
  "disclosure",
]);

// Provision schema for consent rules
const provisionSchema = z.object({
  type: z.enum(["permit", "deny"]).optional(),
  period: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
  actor: z
    .array(
      z.object({
        role: z.string(),
        reference: z.string(),
      })
    )
    .optional(),
  action: z.array(z.string()).optional(),
  purpose: z.array(z.string()).optional(),
  class: z.array(z.string()).optional(),
  code: z
    .array(
      z.object({
        system: z.string(),
        code: z.string(),
        display: z.string().optional(),
      })
    )
    .optional(),
  dataPeriod: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
});

// Create consent schema
const createConsentSchema = z
  .object({
    externalId: z.string().optional(),
    status: ConsentStatus,
    category: ConsentCategory,
    patientId: z.string().min(1, "Patient ID is required"),
    organizationId: z.string().optional(),
    dateTime: z.string().datetime().optional(),
    periodStart: z.string().datetime().optional(),
    periodEnd: z.string().datetime().optional(),
    provision: provisionSchema.optional(),
    sourceAttachment: z.string().url().optional(),
    grantedBy: z.string().optional(),
    witnessedBy: z.string().optional(),
    scope: z.string().optional(),
    purpose: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.periodStart && data.periodEnd) {
        const startTime = new Date(data.periodStart);
        const endTime = new Date(data.periodEnd);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: "Period end must be after start",
      path: ["periodEnd"],
    }
  );

// Update consent schema
const updateConsentSchema = z
  .object({
    externalId: z.string().optional(),
    status: ConsentStatus.optional(),
    category: ConsentCategory.optional(),
    patientId: z.string().min(1, "Patient ID is required").optional(),
    organizationId: z.string().optional(),
    dateTime: z.string().datetime().optional(),
    periodStart: z.string().datetime().optional(),
    periodEnd: z.string().datetime().optional(),
    provision: provisionSchema.optional(),
    sourceAttachment: z.string().url().optional(),
    grantedBy: z.string().optional(),
    witnessedBy: z.string().optional(),
    scope: z.string().optional(),
    purpose: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.periodStart && data.periodEnd) {
        const startTime = new Date(data.periodStart);
        const endTime = new Date(data.periodEnd);
        return endTime > startTime;
      }
      return true;
    },
    {
      message: "Period end must be after start",
      path: ["periodEnd"],
    }
  );

// Consent response schema
const consentResponseSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  status: ConsentStatus,
  category: ConsentCategory,
  patientId: z.string(),
  organizationId: z.string().optional(),
  dateTime: z.string(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  provision: z.any().optional(),
  sourceAttachment: z.string().optional(),
  grantedBy: z.string().optional(),
  witnessedBy: z.string().optional(),
  scope: z.string().optional(),
  purpose: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  patient: z
    .object({
      id: z.string(),
      externalId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .optional(),
});

module.exports = {
  createConsentSchema,
  updateConsentSchema,
  consentResponseSchema,
  ConsentStatus,
  ConsentCategory,
  provisionSchema,
};
