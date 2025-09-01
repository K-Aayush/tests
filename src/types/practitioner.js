const { z } = require("zod");

// Address schema for structured address
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

// Create practitioner schema
const createPractitionerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  npi: z
    .string()
    .regex(/^\d{10}$/, "NPI must be exactly 10 digits")
    .optional(),
  specialty: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]{10,15}$/, "Please provide a valid phone number")
    .optional(),
  address: addressSchema.optional(),
  active: z.boolean().default(true),
  organizationId: z.string().optional(),
});

// Update practitioner schema
const updatePractitionerSchema = createPractitionerSchema.partial();

// Practitioner response schema
const practitionerResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  npi: z.string().optional(),
  specialty: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  active: z.boolean(),
  organizationId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

module.exports = {
  createPractitionerSchema,
  updatePractitionerSchema,
  practitionerResponseSchema,
  addressSchema,
};
