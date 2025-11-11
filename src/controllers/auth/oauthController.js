const prisma = require("../../../prisma/client");
const { verifyFirebaseToken } = require("../../config/firebase");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../config/jwt");
const jwt = require("jsonwebtoken");

exports.oauthLogin = async (req, res) => {
  try {
    const { idToken, provider } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      });
    }

    if (!provider || !["google", "apple"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Valid provider (google or apple) is required",
      });
    }

    const verificationResult = await verifyFirebaseToken(idToken);

    if (!verificationResult.success) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase token",
        error: verificationResult.error,
      });
    }

    const firebaseUser = verificationResult.user;

    const email = firebaseUser.email;
    const authProviderId = firebaseUser.uid;
    const displayName = firebaseUser.name || "";
    const photoURL = firebaseUser.picture || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not provided by OAuth provider",
      });
    }

    const nameParts = displayName ? displayName.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.authProvider === "email" && !user.authProviderId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProviderId,
            authProvider: provider,
            photoURL,
            isEmailVerified: true,
          },
        });
      } else if (user.authProviderId !== authProviderId) {
        return res.status(409).json({
          success: false,
          message: "Email already registered with a different provider",
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            photoURL,
            lastLogin: new Date(),
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          authProvider: provider,
          authProviderId,
          photoURL,
          isEmailVerified: true,
          password: null,
        },
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(payload),
      generateRefreshToken({ id: user.id }),
    ]);

    const accessDecoded = jwt.decode(accessToken);
    const now = new Date();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: now },
    });

    const { password, ...userResponse } = user;

    res.json({
      success: true,
      message: "OAuth login successful",
      data: {
        user: userResponse,
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        sessionId: accessDecoded.jti,
      },
    });
  } catch (error) {
    console.error("OAuth login error:", error);
    res.status(500).json({
      success: false,
      message: "OAuth login failed",
      error: error.code || "LOGIN_ERROR",
    });
  }
};
