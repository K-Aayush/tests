const { z } = require("zod");

// Enums
const ConditionClinicalStatus = z.enum([
  "active",
  "recurrence",
  "relapse",
  "inactive",
  "remission",
  "resolved",
]);

const ConditionVerificationStatus = z.enum([
  "unconfirmed",
  "provisional",
  "differential",
  "confirmed",
  "refuted",
  "entered_in_error",
]);

const ConditionCategory = z.enum(["problem_list_item", "encounter_diagnosis"]);

const ConditionSeverity = z.enum(["mild", "moderate", "severe"]);

// Create condition schema
const createConditionSchema = z.object({
  externalId: z.string().optional(),
  clinicalStatus: ConditionClinicalStatus,
  verificationStatus: ConditionVerificationStatus,
  category: ConditionCategory.optional(),
  severity: ConditionSeverity.optional(),
  code: z.string().min(1, "Condition code is required"),
  codeSystem: z.string().optional(),
  codeDisplay: z.string().optional(),
  subjectId: z.string().min(1, "Patient ID is required"),
  encounterId: z.string().optional(),
  onsetDateTime: z.string().datetime().optional(),
  recordedDate: z.string().datetime().optional(),
  recordedBy: z.string().optional(),
  notes: z.string().optional(),
});

// Update condition schema
const updateConditionSchema = createConditionSchema.partial();

// Condition response schema
const conditionResponseSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  clinicalStatus: ConditionClinicalStatus,
  verificationStatus: ConditionVerificationStatus,
  category: ConditionCategory.optional(),
  severity: ConditionSeverity.optional(),
  code: z.string(),
  codeSystem: z.string().optional(),
  codeDisplay: z.string().optional(),
  subjectId: z.string(),
  encounterId: z.string().optional(),
  onsetDateTime: z.string().optional(),
  recordedDate: z.string(),
  recordedBy: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  subject: z
    .object({
      id: z.string(),
      externalId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .optional(),
  recorder: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      specialty: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createConditionSchema,
  updateConditionSchema,
  conditionResponseSchema,
  ConditionClinicalStatus,
  ConditionVerificationStatus,
  ConditionCategory,
  ConditionSeverity,
};
