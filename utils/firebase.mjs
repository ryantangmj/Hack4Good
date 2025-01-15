// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_z5zxzKWgoT7dMYSC4DNRWURcsMOnmo4",
  authDomain: "hack4good-8248a.firebaseapp.com",
  projectId: "hack4good-8248a",
  storageBucket: "hack4good-8248a.firebasestorage.app",
  messagingSenderId: "249902376979",
  appId: "1:249902376979:web:9748e0e4fd302cfd5a77e6",
  measurementId: "G-FYZ1CKQBP1",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { firestore };
export { auth }; 
