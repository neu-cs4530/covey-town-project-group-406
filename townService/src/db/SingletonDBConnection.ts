import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

export default class SingletonDBConnection {
  private static _db: FirebaseFirestore.Firestore | undefined;

  private constructor() {
    SingletonDBConnection._db = undefined;
  }

  public static instance(): FirebaseFirestore.Firestore {
    if (SingletonDBConnection._db === undefined) {
      dotenv.config();
      initializeApp({
        credential: cert({
          projectId: process.env.FIRESTORE_PROJ_ID,
          privateKey: (process.env.FIRESTORE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
          clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
        }),
      });
      SingletonDBConnection._db = getFirestore();
      SingletonDBConnection._db.settings({ ignoreUndefinedProperties: true });
    }
    return SingletonDBConnection._db;
  }
}
