const patientService = require("../services/patientService");
const {
  createPatientSchema,
  updatePatientSchema,
} = require("../types/patient");
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
  },
};

module.exports = resolvers;
