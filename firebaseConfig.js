// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Firebase configuration
export const firebaseConfig = {  // ✅ Exporting firebaseConfig
    apiKey: "AIzaSyDze2goR4OIzoG4hMxTQ5wp9rPXzBmUN8s",
    authDomain: "hrms-485d8.firebaseapp.com",
    projectId: "hrms-485d8",
    storageBucket: "hrms-485d8.firebaseapp.com", 
    messagingSenderId: "196518577867",
    appId: "1:196518577867:web:d108e3ffa3fa2c52dcfd4e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };  // ✅ Exporting Firestore database instance