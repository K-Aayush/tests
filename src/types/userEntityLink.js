const { z } = require("zod");

// Enums
const EntityType = z.enum(["PATIENT", "PRACTITIONER", "ORGANIZATION"]);

// Create user entity link schema
const createUserEntityLinkSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  entityId: z.string().min(1, "Entity ID is required"),
  entityType: EntityType,
});

// Update user entity link schema
const updateUserEntityLinkSchema = createUserEntityLinkSchema.partial();

// User entity link response schema
const userEntityLinkResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  entityId: z.string(),
  entityType: EntityType,
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z
    .object({
      id: z.string(),
      email: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  createUserEntityLinkSchema,
  updateUserEntityLinkSchema,
  userEntityLinkResponseSchema,
  EntityType,
};
