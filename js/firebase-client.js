// Initializes Firebase and exposes simple auth helpers on window.firebaseAuth
// Uses the modular SDK via ES module imports.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Apple OAuth provider
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// ensure local persistence (keeps user signed in across reloads)
setPersistence(auth, browserLocalPersistence).catch((e) => {
  // non-fatal if persistence can't be set (browser quirks)
  console.warn('setPersistence failed', e);
});

// helper: wait for currentUser to be non-null (with timeout)
function waitForSignIn(timeout = 3000) {
  return new Promise((resolve) => {
    if (auth.currentUser) return resolve(auth.currentUser);
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { off && off(); } catch {}
      resolve(null);
    }, timeout);

    const off = onAuthStateChanged(auth, (user) => {
      if (settled) return;
      if (user) {
        settled = true;
        clearTimeout(timer);
        try { off && off(); } catch {}
        resolve(user);
      }
    });
  });
}

function safeFilename(name) {
  return String(name || 'photo')
    .replace(/[^a-z0-9._-]+/gi, '_')
    .slice(0, 80);
}

async function updateProfilePhoto(file) {
  const user = auth.currentUser || await waitForSignIn(4000);
  if (!user) throw new Error('Not signed in.');

  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  // Store under a user-scoped path to avoid collisions
  const filename = safeFilename(file.name);
  const path = `profilePhotos/${user.uid}/${Date.now()}_${filename}`;
  const objRef = storageRef(storage, path);

  await uploadBytes(objRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=3600'
  });

  const url = await getDownloadURL(objRef);

  // Persist photoURL on the Firebase Auth user profile
  await updateProfile(user, { photoURL: url });

  // Refresh the in-memory user so other UI consumers read the latest profile.
  try {
    await user.reload();
  } catch {
    // Non-fatal; continue with returned URL fallback.
  }

  const refreshedUser = auth.currentUser || user;
  const effectivePhotoURL = refreshedUser.photoURL || url;

  // Notify any page-level UI (header avatar/account page) to update instantly.
  window.dispatchEvent(new CustomEvent('achieve:profile-updated', {
    detail: {
      uid: refreshedUser.uid,
      photoURL: effectivePhotoURL,
      displayName: refreshedUser.displayName || ''
    }
  }));

  return effectivePhotoURL;
}

async function requireUser() {
  return auth.currentUser || await waitForSignIn(4000);
}

async function saveCampSignup(payload) {
  const user = await requireUser();
  if (!user) throw new Error("Please sign in first.");

  const data = {
    campName: String(payload?.campName || "").trim(),
    personal: payload?.personal || {},
    athlete: payload?.athlete || {},
    guardians: payload?.guardians || {},
    userId: user.uid,
    userEmail: user.email || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const ref = await addDoc(collection(db, "users", user.uid, "campSignups"), data);

  await setDoc(
    doc(db, "users", user.uid),
    { lastCampSignupAt: serverTimestamp() },
    { merge: true }
  );

  return { id: ref.id };
}

async function getUserCampSignups() {
  const user = await requireUser();
  if (!user) return [];

  const q = query(
    collection(db, "users", user.uid, "campSignups"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
  signInWithApplePopup() {
    return signInWithPopup(auth, appleProvider);
  },
  signInWithCustomToken(token) {
    return signInWithCustomToken(auth, token);
  },
  signOut() {
    return fbSignOut(auth);
  },
  onAuthStateChanged(cb) {
    return onAuthStateChanged(auth, cb);
  },
  waitForSignIn,
  updateProfilePhoto,
  saveCampSignup,
  getUserCampSignups
};