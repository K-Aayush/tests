const { z } = require("zod");

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }
  };
};

const registerSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name cannot exceed 50 characters")
    .trim(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name cannot exceed 50 characters")
    .trim(),
  role: z.enum(["USER", "ADMIN"]).default("USER").optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .min(1, "Email is required"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .min(1, "Email is required"),
});

const passwordResetSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email address")
    .min(1, "Email is required"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/,
      "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
    ),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Additional validation schemas for future use
const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters long")
    .max(50, "First name cannot exceed 50 characters")
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters long")
    .max(50, "Last name cannot exceed 50 characters")
    .trim()
    .optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/,
        "New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
      ),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

module.exports = {
  validateRequest,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
};
