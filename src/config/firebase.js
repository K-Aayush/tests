const admin = require("firebase-admin");
const { email } = require("zod/v4");

class FirebaseAdminManager {
  constructor() {
    this.instance = null;
    this.isInitialized = false;
    this.initializationError = null;
  }

  initialize() {
    // Return existing instance if already initialized
    if (this.isInitialized && this.instance) {
      return this.instance;
    }

    // Return null if previous initialization failed
    if (this.initializationError) {
      console.warn(
        "Firebase Admin previously failed to initialize:",
        this.initializationError
      );
      return null;
    }

    try {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined;

      if (
        !process.env.FIREBASE_ADMIN_PROJECT_ID ||
        !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
        !privateKey
      ) {
        const error = "Firebase Admin credentials not configured";
        this.initializationError = error;
        console.warn(`${error}. OAuth authentication will not work.`);
        return null;
      }

      this.instance = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });

      this.isInitialized = true;
      console.log("Firebase Admin initialized successfully");
      return this.instance;
    } catch (error) {
      this.initializationError = error.code || "INIT_ERROR";
      console.error(
        "Failed to initialize Firebase Admin:",
        this.initializationError
      );
      return null;
    }
  }

  async verifyToken(idToken) {
    try {
      if (!idToken) {
        return {
          success: false,
          error: "Token is required",
        };
      }

      if (typeof idToken !== "string") {
        return {
          success: false,
          error: "Token must be a string",
        };
      }

      if (idToken.trim().length === 0) {
        return {
          success: false,
          error: "Token cannot be empty",
        };
      }

      if (idToken.length < 100 || idToken.length > 2048) {
        return {
          success: false,
          error: "Token format appears invalid",
        };
      }

      const firebaseApp = this.initialize();
      if (!firebaseApp) {
        throw new Error("Firebase Admin not initialized");
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return {
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          emailVerified: decodedToken.email_verified || false,
          name: decodedToken.name || null,
          picture: decodedToken.picture || null,
          phoneNumber: decodedToken.phone_number || null,
        },
        metadata: {
          authTime: decodedToken.auth_time,
          issuedAt: decodedToken.iat,
          expiresAt: decodedToken.exp,
          issuer: decodedToken.iss,
          audience: decodedToken.aud,
          subject: decodedToken.sub,
        },

        signInProvider: decodedToken.firebase?.sign_in_provider || null,
      };
    } catch (error) {
      console.error(
        "Firebase token verification failed:",
        error.code || "VERIFY_ERROR"
      );
      return {
        success: false,
        error: error.code || "Token verification failed",
      };
    }
  }

  // Useful for cleanup in tests or hot-reload scenarios
  async cleanup() {
    if (this.instance) {
      try {
        await this.instance.delete();
        this.instance = null;
        this.isInitialized = false;
        this.initializationError = null;
        console.log("Firebase Admin cleaned up successfully");
      } catch (error) {
        console.error(
          "Failed to cleanup Firebase Admin:",
          error.code || "CLEANUP_ERROR"
        );
      }
    }
  }
}

const firebaseAdminManager = new FirebaseAdminManager();

module.exports = {
  initializeFirebaseAdmin: () => firebaseAdminManager.initialize(),
  verifyFirebaseToken: (token) => firebaseAdminManager.verifyToken(token),
  cleanupFirebaseAdmin: () => firebaseAdminManager.cleanup(),
  firebaseAdminManager,
};
