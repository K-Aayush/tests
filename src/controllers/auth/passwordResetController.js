const bcrypt = require("bcrypt");
const prisma = require("../../../prisma/client");
const emailService = require("../../services/emailService");

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
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
