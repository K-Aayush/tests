const bcrypt = require("bcrypt");
const prisma = require("../../../prisma/client");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../config/jwt");
const jwt = require("jsonwebtoken");

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

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Email verification required. Please verify your email before logging in.",
      });
    }

    // Generate tokens
    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken({ id: user.id });

    // Extract JTI from tokens for session tracking
    const accessDecoded = jwt.decode(accessToken);
    const refreshDecoded = jwt.decode(refreshToken);
    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Create login session record
    await prisma.loginSession.create({
      data: {
        userId: user.id,
        jti: accessDecoded.jti,
        iat: new Date(accessDecoded.iat * 1000),
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
        expiresAt: new Date(accessDecoded.exp * 1000),
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
        sessionId: accessDecoded.jti,
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
