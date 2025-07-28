const prisma = require("../../../prisma/client");
const { generateAccessToken, verifyRefreshToken } = require("../../config/jwt");

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
    await verifyRefreshToken(refreshToken);

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
    const newAccessToken = await generateAccessToken(payload);

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
