const patientService = require("../services/patientService");
const userEntityLinkService = require("../services/userEntityLinkService");
const bcrypt = require("bcrypt");
const prisma = require("../../prisma/client");
const {
  createPatientSchema,
  updatePatientSchema,
} = require("../types/patient");
const { createUserEntityLinkSchema } = require("../types/userEntityLink");
const { GraphQLError } = require("graphql");

class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }
}

class ForbiddenError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }
}

class UserInputError extends GraphQLError {
  constructor(message, extensions) {
    super(message, {
      extensions: {
        code: "BAD_USER_INPUT",
        ...extensions,
      },
    });
  }
}

const resolvers = {
  Query: {
    patient: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenError("Email verification required");
      }

      const patient = await patientService.getPatientById(id);
      if (!patient) {
        throw new UserInputError("Patient not found");
      }

      return patient;
    },

    patients: async (_, { page = 1, limit = 10, filters = {} }, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenError("Email verification required");
      }

      return await patientService.getAllPatients(page, limit, filters);
    },
  },

  Mutation: {
    createPatientPortalAccount: async (_, { input }, { user }) => {
      try {
        const {
          // User fields
          email,
          password,
          firstName,
          lastName,
          middleName,
          phoneNumber,
          // Patient fields
          patientFirstName,
          patientLastName,
          patientMiddleName,
          preferredName,
          contactPointType,
          contactPointValue,
          gender,
          birthDate,
          deceased,
          address,
          identifier,
          maritalStatus,
          empi,
          generalPractitioner,
        } = input;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          throw new UserInputError("User with this email already exists");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            middleName,
            phoneNumber,
          },
        });

        // Create patient
        const patientData = {
          firstName: patientFirstName,
          lastName: patientLastName,
          middleName: patientMiddleName,
          preferredName,
          contactPointType,
          contactPointValue,
          gender,
          birthDate,
          deceased,
          address,
          identifier,
          maritalStatus,
          empi,
          generalPractitioner,
        };

        const patient = await patientService.createPatient(patientData);

        // Create user entity link
        const linkData = {
          userId: newUser.id,
          entityId: patient.id,
          entityType: "PATIENT",
        };

        // Validate the link data
        const validatedLinkData = createUserEntityLinkSchema.parse(linkData);

        const userEntityLink = await userEntityLinkService.createUserEntityLink(
          validatedLinkData
        );

        return {
          user: newUser,
          patient,
          userEntityLink,
        };
      } catch (error) {
        if (error.name === "ZodError") {
          throw new UserInputError("Validation error", {
            validationErrors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        throw error;
      }
    },

    createPatient: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenError("Email verification required");
      }

      try {
        const validatedData = createPatientSchema.parse(input);
        return await patientService.createPatient(validatedData);
      } catch (error) {
        if (error.name === "ZodError") {
          throw new UserInputError("Validation error", {
            validationErrors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        throw error;
      }
    },

    updatePatient: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenError("Email verification required");
      }

      // Check if patient exists
      const existingPatient = await patientService.getPatientById(id);
      if (!existingPatient) {
        throw new UserInputError("Patient not found");
      }

      try {
        const validatedData = updatePatientSchema.parse(input);
        return await patientService.updatePatient(id, validatedData);
      } catch (error) {
        if (error.name === "ZodError") {
          throw new UserInputError("Validation error", {
            validationErrors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          });
        }
        throw error;
      }
    },

    deletePatient: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenError("Email verification required");
      }

      const existingPatient = await patientService.getPatientById(id);
      if (!existingPatient) {
        throw new UserInputError("Patient not found");
      }

      await patientService.deletePatient(id);
      return true;
    },

    me: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      // Get user with entity links
      const userWithLinks = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          UserEntityLink: {
            include: {
              user: true,
            },
          },
        },
      });

      return userWithLinks;
    },

    myPatientRecord: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError("Authentication required");
      }

      if (!user.isEmailVerified) {
        throw new ForbiddenError("Email verification required");
      }

      // Get user's patient record
      const patient = await userEntityLinkService.getUserPatient(user.id);

      if (!patient) {
        throw new UserInputError("No patient record found for this user");
      }

      return patient;
    },
  },
};

module.exports = resolvers;
