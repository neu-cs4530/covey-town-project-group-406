import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyApxbfDJFAVJ19wqdaQDGp7Q0AXlRJUexc',
  authDomain: 'fir-tutorial-e5a27.firebaseapp.com',
  projectId: 'fir-tutorial-e5a27',
  storageBucket: 'fir-tutorial-e5a27.appspot.com',
  messagingSenderId: '167509958292',
  appId: '1:167509958292:web:f9e83033bb5f68dace1e81',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;
