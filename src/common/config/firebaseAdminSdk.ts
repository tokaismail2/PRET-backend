let firebaseAdmin: any = null;
let admin: any = null;

/**
 * Initialize Firebase Admin SDK
 * Supports both service account key file and environment variable
 */
export function initializeFirebaseAdmin(): any {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    admin = require('firebase-admin');
    
    // Check if Firebase is already initialize
    if (admin.apps && admin.apps.length > 0) {
      firebaseAdmin = admin.app();
      return firebaseAdmin;
    }
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const serviceAccount = require(serviceAccountPath);
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      return firebaseAdmin;
    }
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
    const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (firebaseProjectId && firebasePrivateKey && firebaseClientEmail) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseProjectId,
          privateKey: firebasePrivateKey,
          clientEmail: firebaseClientEmail,
        })
      });
      return firebaseAdmin;
    }

    // Option 3: Use default credentials (for Google Cloud environments)
    try {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      return firebaseAdmin;
    } catch (defaultError) {
      console.warn('⚠️ Firebase Admin SDK: No credentials found. Push notifications will be disabled.');
      console.warn('   To enable Firebase, install firebase-admin package and set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
      return null;
    }
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️ firebase-admin package not installed. Push notifications will be disabled.');
      console.warn('   Install it with: npm install firebase-admin');
      return null;
    }
    
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.warn('⚠️ Push notifications will be disabled');
    return null;
  }
}

/**
 * Get Firebase Admin instance
 * Initializes if not already initialized
 */
export function getFirebaseAdmin(): any {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
}

// Initialize on module load
const adminInstance = initializeFirebaseAdmin();

export default adminInstance;
