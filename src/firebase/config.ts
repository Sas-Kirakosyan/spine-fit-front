const firebaseConfig = {
  apiKey: "AIzaSyCwEaZvboIB4qA9vHW7QYW49atpi3-HfIg",
  authDomain: "spinefit-ff5f2.firebaseapp.com",
  projectId: "spinefit-ff5f2",
  storageBucket: "spinefit-ff5f2.firebasestorage.app",
  messagingSenderId: "498351662487",
  appId: "1:498351662487:web:8ceb3536fd6c275bab10d2",
};

let app: any = null;
let auth: any = null;
let googleProvider: any = null;
let initialized = false;

// Lazy load Firebase on first use
const initializeFirebase = async () => {
  if (initialized) {
    return { app, auth, googleProvider };
  }

  const { initializeApp } = await import("firebase/app");
  const { getAuth, GoogleAuthProvider } = await import("firebase/auth");

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  initialized = true;

  return { app, auth, googleProvider };
};

export { initializeFirebase };

export const getApp = async () => {
  const { app } = await initializeFirebase();
  return app;
};

export const getAuth_ = async () => {
  const { auth } = await initializeFirebase();
  return auth;
};

export const getGoogleProvider = async () => {
  const { googleProvider } = await initializeFirebase();
  return googleProvider;
};

export default initializeFirebase;
