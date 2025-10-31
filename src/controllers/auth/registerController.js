const bcrypt = require("bcrypt");
const prisma = require("../../../prisma/client");
const emailService = require("../../services/emailService");

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, middleName, phoneNumber } =
      req.body;

    if (!email || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Email, first name, last name, and phone number are required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for email registration.",
      });
    }

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
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phoneNumber: true,
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
