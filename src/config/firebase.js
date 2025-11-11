const admin = require("firebase-admin");

// ============================================================================
// CONSTANTS & VALIDATION
// ============================================================================

const REQUIRED_IMPERSONATION_ENV_VARS = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_EMAIL'
];

const FIREBASE_ERROR_CODES = {
  'auth/id-token-expired': 'TOKEN_EXPIRED',
  'auth/id-token-revoked': 'TOKEN_REVOKED',
  'auth/invalid-id-token': 'INVALID_TOKEN',
  'auth/user-not-found': 'USER_NOT_FOUND',
  'auth/user-disabled': 'USER_DISABLED',
  'auth/project-not-found': 'PROJECT_NOT_FOUND',
  'auth/insufficient-permission': 'INSUFFICIENT_PERMISSION',
  'auth/internal-error': 'INTERNAL_ERROR'
};

// ============================================================================
// FIREBASE ADMIN MANAGER
// ============================================================================

class FirebaseAdminManager {
  constructor() {
    this.instance = null;
    this.isInitialized = false;
    this.initializationError = null;
  }

  /**
   * Validates required environment variables for impersonation
   * @returns {Object} Validation result
   */
  validateEnvironment() {
    const missing = REQUIRED_IMPERSONATION_ENV_VARS.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      return {
        isValid: false,
        missingVars: missing,
        message: `Missing Firebase environment variables: ${missing.join(', ')}`
      };
    }

    // Safely validate service account email format
    const serviceAccountEmail = process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
    if (serviceAccountEmail) {
      if (typeof serviceAccountEmail !== 'string') {
        return {
          isValid: false,
          message: 'FIREBASE_SERVICE_ACCOUNT_EMAIL must be a string'
        };
      }

      const trimmedEmail = serviceAccountEmail.trim();
      if (!trimmedEmail) {
        return {
          isValid: false,
          message: 'FIREBASE_SERVICE_ACCOUNT_EMAIL cannot be empty'
        };
      }

      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.iam.gserviceaccount.com')) {
        return {
          isValid: false,
          message: 'FIREBASE_SERVICE_ACCOUNT_EMAIL appears to be malformed'
        };
      }

      // Validate email format more thoroughly
      const emailRegex = /^[a-zA-Z0-9-]+@[a-zA-Z0-9-]+\.iam\.gserviceaccount\.com$/;
      if (!emailRegex.test(trimmedEmail)) {
        return {
          isValid: false,
          message: 'FIREBASE_SERVICE_ACCOUNT_EMAIL format is invalid'
        };
      }
    }

    // Validate project ID format
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    if (projectId) {
      const trimmedProjectId = projectId.trim();
      if (!trimmedProjectId || !/^[a-z0-9-]+$/.test(trimmedProjectId)) {
        return {
          isValid: false,
          message: 'FIREBASE_ADMIN_PROJECT_ID format is invalid (must be lowercase letters, numbers, and hyphens)'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validates Firebase ID token format
   * @param {string} idToken - Firebase ID token
   * @returns {Object} Validation result
   */
  validateTokenFormat(idToken) {
    // Check basic requirements
    if (!idToken || typeof idToken !== 'string') {
      return {
        isValid: false,
        error: 'INVALID_TOKEN_TYPE',
        message: 'Token must be a non-empty string'
      };
    }

    const trimmedToken = idToken.trim();
    
    // Check for empty token
    if (trimmedToken.length === 0) {
      return {
        isValid: false,
        error: 'EMPTY_TOKEN',
        message: 'Token cannot be empty'
      };
    }

    // JWT tokens have 3 parts separated by dots
    const parts = trimmedToken.split('.');
    if (parts.length !== 3) {
      return {
        isValid: false,
        error: 'MALFORMED_TOKEN',
        message: 'Token does not appear to be a valid JWT'
      };
    }

    // Check reasonable length bounds (Firebase tokens are typically 800-2000 chars)
    if (trimmedToken.length < 500 || trimmedToken.length > 4000) {
      return {
        isValid: false,
        error: 'INVALID_TOKEN_LENGTH',
        message: 'Token length is outside expected range'
      };
    }

    // Validate JWT header and payload are valid base64url
    try {
      for (let i = 0; i < 2; i++) {
        const part = parts[i];
        if (!/^[A-Za-z0-9_-]+$/.test(part)) {
          return {
            isValid: false,
            error: 'INVALID_TOKEN_ENCODING',
            message: 'Token contains invalid characters'
          };
        }
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'TOKEN_VALIDATION_ERROR',
        message: 'Token validation failed'
      };
    }

    return { isValid: true };
  }

  /**
   * Initialize Firebase Admin SDK with service account impersonation
   */
  async initialize() {
    // Return existing instance if already initialized
    if (this.isInitialized && this.instance) {
      return this.instance;
    }

    // Return null if previous initialization failed
    if (this.initializationError) {
      return null;
    }

    try {
      console.log('🔄 Initializing Firebase Admin with service account impersonation...');

      // Check if Firebase is completely disabled
      if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
        console.warn("Firebase configuration not found - OAuth authentication disabled");
        this.initializationError = new Error("Firebase not configured");
        return null;
      }

      // Validate environment variables
      const validation = this.validateEnvironment();
      if (!validation.isValid) {
        console.warn(`Firebase Admin: ${validation.message}`);
        console.warn("OAuth authentication will not be available");
        this.initializationError = new Error(validation.message);
        return null;
      }

      // Use Application Default Credentials for impersonation
      const credential = admin.credential.applicationDefault();
      
      this.instance = admin.initializeApp({
        credential: credential,
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      });

      this.isInitialized = true;
      console.log("Firebase Admin SDK initialized with service account impersonation");
      
      return this.instance;

    } catch (error) {
      this.initializationError = error;
      
      // Provide helpful error messages based on error type
      let hint = 'Make sure you are authenticated with: gcloud auth application-default login';
      if (error.code === 'ENOENT' || error.message.includes('application_default_credentials.json')) {
        hint = 'Run: gcloud auth application-default login';
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        hint = 'Check that your Google Cloud account has Firebase Admin permissions for this project';
      } else if (error.message.includes('project')) {
        hint = 'Verify that the Firebase project exists and you have access to it';
      }
      
      console.error("Firebase Admin initialization failed:", {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        hint: hint
      });
      
      return null;
    }
  }

  /**
   * Verify Firebase ID token
   * @param {string} idToken - Firebase ID token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken(idToken) {
    try {
      // Input validation
      const validation = this.validateTokenFormat(idToken);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          message: validation.message,
        };
      }

      // Ensure Firebase is initialized
      const firebaseApp = await this.initialize();
      if (!firebaseApp) {
        return {
          success: false,
          error: 'FIREBASE_NOT_INITIALIZED',
          message: 'Firebase Admin SDK is not available',
        };
      }

      // Verify the token with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Token verification timeout')), 10000);
      });

      const verificationPromise = admin.auth().verifyIdToken(idToken.trim());
      const decodedToken = await Promise.race([verificationPromise, timeoutPromise]);
      
      // Validate required token claims
      if (!decodedToken.uid || !decodedToken.email) {
        return {
          success: false,
          error: 'INVALID_TOKEN_CLAIMS',
          message: 'Token missing required claims',
        };
      }

      // Additional security checks
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp <= now) {
        return {
          success: false,
          error: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        };
      }

      if (decodedToken.iat > now + 300) { // Allow 5 minute clock skew
        return {
          success: false,
          error: 'TOKEN_FUTURE',
          message: 'Token issued in the future',
        };
      }

      return {
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email.toLowerCase(), // Normalize email
          email_verified: Boolean(decodedToken.email_verified),
          name: decodedToken.name || null,
          picture: decodedToken.picture || null,
          phone_number: decodedToken.phone_number || null,
        },
        metadata: {
          auth_time: decodedToken.auth_time,
          iat: decodedToken.iat,
          exp: decodedToken.exp,
          iss: decodedToken.iss,
          aud: decodedToken.aud,
          sub: decodedToken.sub,
          sign_in_provider: decodedToken.firebase?.sign_in_provider || null,
          verifiedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      // Map Firebase errors to standardized error codes
      const errorCode = FIREBASE_ERROR_CODES[error.code] || 'VERIFICATION_FAILED';
      
      // Log error securely (don't expose token content)
      console.error(`🔒 Firebase token verification failed: ${errorCode}`, {
        code: error.code,
        message: error.message,
        tokenLength: idToken?.length || 0,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: errorCode,
        message: 'Token verification failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      };
    }
  }

  /**
   * Get client configuration for frontend (safe for public use)
   * @returns {Object|null} Client configuration
   */
  getClientConfig() {
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
      return null;
    }

    return {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      authDomain: `${process.env.FIREBASE_ADMIN_PROJECT_ID}.firebaseapp.com`,
      // Add these if you have them in your environment
      apiKey: process.env.FIREBASE_API_KEY || null,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || null,
      appId: process.env.FIREBASE_APP_ID || null,
    };
  }

  /**
   * Health check for Firebase Admin
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      isInitialized: this.isInitialized,
      hasError: !!this.initializationError,
      errorMessage: this.initializationError?.message || null,
      authMethod: 'service_account_impersonation',
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || null,
      serviceAccountEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || null,
      lastHealthCheck: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Cleanup Firebase Admin instance
   */
  async cleanup() {
    if (this.instance) {
      try {
        await this.instance.delete();
        console.log("✅ Firebase Admin SDK cleaned up successfully");
      } catch (error) {
        console.error("Firebase Admin cleanup failed:", {
          message: error.message,
          code: error.code || 'CLEANUP_ERROR',
        });
      } finally {
        this.instance = null;
        this.isInitialized = false;
        this.initializationError = null;
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE & EXPORTS
// ============================================================================

const firebaseManager = new FirebaseAdminManager();

/**
 * Initialize Firebase Admin SDK
 * @returns {Promise<admin.app.App|null>}
 */
const initializeFirebaseAdmin = async () => {
  return await firebaseManager.initialize();
};

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>} Verification result
 */
const verifyFirebaseToken = async (idToken) => {
  return await firebaseManager.verifyToken(idToken);
};

/**
 * Get Firebase client configuration (safe for frontend)
 * @returns {Object|null} Client configuration
 */
const getFirebaseClientConfig = () => {
  return firebaseManager.getClientConfig();
};

/**
 * Get Firebase service health status
 * @returns {Object} Health status
 */
const getFirebaseHealthStatus = () => {
  return firebaseManager.getHealthStatus();
};

/**
 * Cleanup Firebase resources
 * @returns {Promise<void>}
 */
const cleanupFirebase = async () => {
  await firebaseManager.cleanup();
};

// Graceful shutdown handlers
process.on('SIGINT', cleanupFirebase);
process.on('SIGTERM', cleanupFirebase);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  getFirebaseClientConfig,
  getFirebaseHealthStatus,
  cleanupFirebase,
  
  // For testing purposes
  __firebaseManager: process.env.NODE_ENV === 'test' ? firebaseManager : undefined,
};
