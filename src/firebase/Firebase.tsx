import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {getFirestore} from 'firebase/firestore'
import {createContext, useContext, useEffect, useState} from "react";

const firebaseConfig = {
    apiKey: "AIzaSyCRLKcOwgF7Iv-gsmpgtvRfIH_bwTPp5vM",
    authDomain: "crmreact-19629.firebaseapp.com",
    projectId: "crmreact-19629",
    storageBucket: "crmreact-19629.appspot.com",
    messagingSenderId: "102705941741",
    appId: "1:102705941741:web:b5bd65d9d4f12ed6c610e4",
    measurementId: "G-6HBP65KG0E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestoreBase = getFirestore(app)
