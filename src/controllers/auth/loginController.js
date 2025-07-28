const bcrypt = require("bcrypt");
const prisma = require("../../../prisma/client");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../config/jwt");

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
    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken({ id: user.id });

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
