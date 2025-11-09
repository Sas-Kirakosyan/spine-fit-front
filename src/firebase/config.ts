import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwEaZvboIB4qA9vHW7QYW49atpi3-HfIg",
  authDomain: "spinefit-ff5f2.firebaseapp.com",
  projectId: "spinefit-ff5f2",
  storageBucket: "spinefit-ff5f2.firebasestorage.app",
  messagingSenderId: "498351662487",
  appId: "1:498351662487:web:8ceb3536fd6c275bab10d2",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export default app;
