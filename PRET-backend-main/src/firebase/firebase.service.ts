import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize Firebase Admin SDK
    // You can use service account key file or environment variables
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const serviceAccountKey = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY');

      if (projectId) {
        // Initialize using environment variables
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey?.replace(/\\n/g, '\n'),
          }),
        });
      } else if (serviceAccountKey) {
        // Initialize using service account key file path
        const serviceAccount = require(serviceAccountKey);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // Try to use default credentials (for Google Cloud environments)
        try {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
        } catch (error) {
          console.warn(
            'Firebase Admin SDK not initialized. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.',
          );
        }
      }
    } else {
      this.firebaseApp = admin.app();
    }
  }

  getAuth(): admin.auth.Auth {
    if (!this.firebaseApp) {
      throw new Error(
        'Firebase Admin SDK not initialized. Please configure Firebase credentials.',
      );
    }
    return admin.auth();
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.firebaseApp) {
      throw new Error(
        'Firebase Admin SDK not initialized. Please configure Firebase credentials.',
      );
    }
    return this.getAuth().verifyIdToken(idToken);
  }
}

