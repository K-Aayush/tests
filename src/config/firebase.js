const admin = require("firebase-admin");

let firebaseAdmin = null;

const initializeFirebaseAdmin = () => {
  if (firebaseAdmin) {
    return firebaseAdmin;
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
      console.warn(
        "Firebase Admin credentials not configured. OAuth authentication will not work."
      );
      return null;
    }

    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log("Firebase Admin initialized successfully");
    return firebaseAdmin;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error.message);
    return null;
  }
};

const verifyFirebaseToken = async (idToken) => {
  try {
    const firebaseApp = initializeFirebaseAdmin();
    if (!firebaseApp) {
      throw new Error("Firebase Admin not initialized");
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      user: decodedToken,
    };
  } catch (error) {
    console.error("Firebase token verification failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

const getFirebaseClientConfig = () => {
  return {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
};

module.exports = {
  initializeFirebaseAdmin,
  verifyFirebaseToken,
  getFirebaseClientConfig,
};
