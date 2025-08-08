const prisma = require("../../../prisma/client");
const jwt = require("jsonwebtoken");

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(" ")[1];

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Invalidate login session if access token is provided
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.jti) {
          await prisma.loginSession.updateMany({
            where: { jti: decoded.jti },
            data: { isActive: false },
          });
        }
      } catch (error) {
        console.error("Failed to invalidate session:", error);
      }
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
