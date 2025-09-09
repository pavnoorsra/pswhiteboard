// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCzBLLb3qTy1X8mhYZzY87Dz7QrTPz6he0",
  authDomain: "pswhiteboard-15a5a.firebaseapp.com",
  databaseURL: "https://pswhiteboard-15a5a-default-rtdb.firebaseio.com",
  projectId: "pswhiteboard-15a5a",
  storageBucket: "pswhiteboard-15a5a.firebasestorage.app",
  messagingSenderId: "979170871161",
  appId: "1:979170871161:web:0fcd689b1d0878ebcf51a8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export database for use in other files
export const database = getDatabase(app);
