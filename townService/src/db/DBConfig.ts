// example firebase db setup
// // Import the functions you need from the SDKs you need

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();
console.log('in db config 0');

console.log('in db config 1');
initializeApp({
  credential: cert({
    projectId: process.env.FIRESTORE_PROJ_ID,
    privateKey: (process.env.FIRESTORE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
    clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
  }),
});
console.log('in db config 2');

const db = getFirestore();
console.log('in db config 3');

export default db;
console.log('in db config 4');
