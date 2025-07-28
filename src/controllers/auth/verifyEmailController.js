const prisma = require("../../../prisma/client");

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
