const bcrypt = require("bcrypt");
const prisma = require("../../prisma/client");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");
const emailService = require("../services/emailService");

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP for email verification
    const otp = emailService.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Store OTP
    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        type: "verification",
        expiresAt: otpExpiry,
      },
    });

    // Send verification email
    const emailResult = await emailService.sendVerificationOTP(
      email,
      otp,
      firstName
    );

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email for verification code.",
      data: {
        user,
        emailSent: emailResult.success,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find valid OTP
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email,
        otp,
        type: "verification",
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Update user as verified and mark OTP as used
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { isEmailVerified: true },
      }),
      prisma.emailOTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        refreshTokens: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: user.id });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Remove password from response
    const { password: _, refreshTokens, ...userResponse } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    // Verify refresh token
    verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Generate new access token
    const payload = {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
    };
    const newAccessToken = generateAccessToken(payload);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        tokenType: "Bearer",
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: "If the email exists, a password reset code has been sent",
      });
    }

    // Generate OTP
    const otp = emailService.generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Store OTP
    await prisma.emailOTP.create({
      data: {
        email,
        otp,
        type: "password_reset",
        expiresAt: otpExpiry,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetOTP(email, otp, user.firstName);

    res.json({
      success: true,
      message: "If the email exists, a password reset code has been sent",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset request failed",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find valid OTP
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email,
        otp,
        type: "password_reset",
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and mark OTP as used
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.emailOTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
      // Invalidate all refresh tokens
      prisma.refreshToken.deleteMany({
        where: {
          user: { email },
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};
