// Initializes Firebase and exposes simple auth helpers on window.firebaseAuth
// Uses the modular SDK via ES module imports.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXYi7MCm-aMBeh3bEjs0eJ5eHcGjf9-bw",
  authDomain: "achieve-cb085.firebaseapp.com",
  projectId: "achieve-cb085",
  storageBucket: "achieve-cb085.firebasestorage.app",
  messagingSenderId: "260668035138",
  appId: "1:260668035138:web:ba67a28ffd83d01b279ddb",
  measurementId: "G-JWFXTNTCGZ",
  databaseURL: "https://achieve-cb085-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ensure local persistence (keeps user signed in across reloads)
setPersistence(auth, browserLocalPersistence).catch((e) => {
  // non-fatal if persistence can't be set (browser quirks)
  console.warn('setPersistence failed', e);
});

// helper: wait for currentUser to be non-null (with timeout)
function waitForSignIn(timeout = 3000) {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) return resolve(auth.currentUser);
    const unsubs = [];
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubs.forEach(u => u && u());
      resolve(null);
    }, timeout);

    const off = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      if (user) {
        settled = true;
        clearTimeout(timer);
        unsubs.forEach(u => u && u());
        resolve(user);
      }
    });
    unsubs.push(off);
  });
}

// expose simple API for other scripts
window.firebaseAuth = {
  auth,
  signupEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  signInEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },
  signInWithGooglePopup() {
    return signInWithPopup(auth, googleProvider);
  },
  signOut() {
    return fbSignOut(auth);
  },
  onAuthStateChanged(cb) {
    return onAuthStateChanged(auth, cb);
  },
  waitForSignIn
};