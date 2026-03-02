// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_KEY || process.env.NEXT_PUBLIC_FIREBASE_KEY,
  authDomain: "clean-labs.firebaseapp.com",
  projectId: "clean-labs",
  storageBucket: "clean-labs.firebasestorage.app",
  messagingSenderId: "1046802932584",
  appId: "1:1046802932584:web:6443f7c5ef278bc5aaecdd",
  measurementId: "G-HBCB97VRZ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function addToList(email: string, notes: string = "") {
  try {
    const docRef = await addDoc(collection(db, "waitlist"), {
      email: email,
      notes: notes,
      submitted_at: new Date()
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}