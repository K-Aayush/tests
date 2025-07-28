const bcrypt = require("bcrypt");
const prisma = require("../../../prisma/client");
const emailService = require("../../services/emailService");

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      phoneNumber,
      role,
    } = req.body;

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
        middleName,
        phoneNumber,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phoneNumber: true,
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
