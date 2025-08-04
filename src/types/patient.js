const { z } = require("zod");

// Enums
const AdministrativeGender = z.enum(["male", "female", "other", "unknown"]);
const ContactPointSystem = z.enum(["phone", "fax", "email", "sms"]);
const AddressType = z.enum(["postal", "physical", "both"]);
const AddressUse = z.enum(["home", "work", "temp", "old", "billing"]);
const IdentifierUse = z.enum(["usual", "official", "temp", "secondary", "old"]);

// Address schema
const addressSchema = z.object({
  use: AddressUse.optional(),
  type: AddressType.optional(),
  text: z.string().optional(),
  line: z.array(z.string()).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

// Identifier schema
const identifierSchema = z.object({
  use: IdentifierUse.optional(),
  system: z.string().optional(),
  value: z.string().min(1, "Identifier value is required"),
  type: z.string().optional(),
});

// Create patient schema
const createPatientSchema = z.object({
  identifier: z.array(identifierSchema).optional(),
  active: z.boolean().default(true),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  preferredName: z.string().optional(),
  contactPointType: ContactPointSystem.optional(),
  contactPointValue: z.string().optional(),
  gender: AdministrativeGender.optional(),
  birthDate: z.string().datetime().optional(),
  deceased: z.boolean().optional(),
  address: z.array(addressSchema).optional(),
  maritalStatus: z.string().optional(),
  empi: z.string().optional(),
  generalPractitioner: z.string().optional(),
});

// Update patient schema
const updatePatientSchema = createPatientSchema.partial();

// Patient response schema
const patientResponseSchema = z.object({
  id: z.string(),
  identifier: z
    .array(
      z.object({
        id: z.string(),
        use: IdentifierUse.optional(),
        system: z.string().optional(),
        value: z.string(),
        type: z.string().optional(),
      })
    )
    .optional(),
  active: z.boolean(),
  firstName: z.string(),
  middleName: z.string().optional(),
  lastName: z.string(),
  preferredName: z.string().optional(),
  contactPointType: ContactPointSystem.optional(),
  contactPointValue: z.string().optional(),
  gender: AdministrativeGender.optional(),
  birthDate: z.string().optional(),
  deceased: z.boolean().optional(),
  address: z
    .array(
      z.object({
        id: z.string(),
        use: AddressUse.optional(),
        type: AddressType.optional(),
        text: z.string().optional(),
        line: z.array(z.string()),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
      })
    )
    .optional(),
  maritalStatus: z.string().optional(),
  empi: z.string().optional(),
  generalPractitioner: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  patientResponseSchema,
  AdministrativeGender,
  ContactPointSystem,
  AddressType,
  AddressUse,
  IdentifierUse,
};
