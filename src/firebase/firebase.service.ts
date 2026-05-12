import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    if (admin.apps.length) {
      this.firebaseApp = admin.app();
      return;
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const rawPrivateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const serviceAccountKeyPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY');

    if (projectId && clientEmail && rawPrivateKey) {
      // Normalize escaped newlines from .env (e.g. \\n -> \n)
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });

      this.logger.log(`Firebase Admin SDK initialized for project: ${projectId}`);
    } else if (serviceAccountKeyPath) {
      const sa = require(serviceAccountKeyPath);
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
      this.logger.log('Firebase Admin SDK initialized via service account key file');
    } else {
      this.logger.error(
        'Firebase Admin SDK NOT initialized. ' +
        'Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.',
      );
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

