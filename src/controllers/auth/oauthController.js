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
    const firebaseUid = firebaseUser.uid;
    const displayName = firebaseUser.name || "";
    const photoURL = firebaseUser.picture || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not provided by OAuth provider",
      });
    }

    const nameParts = displayName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.authProvider === "email" && !user.firebaseUid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firebaseUid,
            authProvider: provider,
            photoURL,
            isEmailVerified: true,
          },
        });
      } else if (user.firebaseUid !== firebaseUid) {
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
          firebaseUid,
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

    const accessToken = await generateAccessToken(payload);
    const refreshToken = await generateRefreshToken({ id: user.id });

    const accessDecoded = jwt.decode(accessToken);

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
      data: { lastLogin: new Date() },
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
      error: error.message,
    });
  }
};

exports.getFirebaseConfig = async (req, res) => {
  try {
    const { getFirebaseClientConfig } = require("../../config/firebase");
    const config = getFirebaseClientConfig();

    if (!config.apiKey) {
      return res.status(503).json({
        success: false,
        message: "Firebase not configured on server",
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Get Firebase config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get Firebase configuration",
    });
  }
};
