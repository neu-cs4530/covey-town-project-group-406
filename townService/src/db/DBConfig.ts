// example firebase db setup
// // Import the functions you need from the SDKs you need

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

initializeApp({
  credential: cert({
    projectId: process.env.FIRESTORE_PROJ_ID,
    privateKey: (process.env.FIRESTORE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
  }),
});

const db = getFirestore();

export default db;
