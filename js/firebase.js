// ============================================================
// PathGuard — Firebase Service Layer
// Config is injected by serve.ps1 from .env into:
//   /js/firebase-config.js  →  window.__PATHGUARD_CONFIG__
// ============================================================

import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc, setDoc, getDoc, getDocs,
  collection, query, where, orderBy,
  addDoc, serverTimestamp, writeBatch,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Config: injected by serve.ps1 from .env into firebase-config.js
// Falls back to known project values; apiKey/appId must be set in .env
const _injected = window.__PATHGUARD_CONFIG__ || {};

// Known values from your Firebase project identity-security-58adc
// (projectId, authDomain, storageBucket are safe to hardcode — they're public)
const cfg = {
  projectId:         "identity-security-58adc",
  authDomain:        "identity-security-58adc.firebaseapp.com",
  storageBucket:     "identity-security-58adc.appspot.com",
  databaseId:        _injected.databaseId        || "indentity",
  // These 3 come from .env → serve.ps1 → firebase-config.js injection:
  apiKey:            _injected.apiKey            || "AIzaSyBJsXHPvHbo1yj20_rCJvcPcUp_9wLYuHM",
  messagingSenderId: _injected.messagingSenderId || "",
  appId:             _injected.appId             || "",
  measurementId:     _injected.measurementId     || "",
};

const MISSING_PLACEHOLDER = ["","PASTE_YOUR_WEB_API_KEY_HERE","PASTE_YOUR_SENDER_ID_HERE","PASTE_YOUR_APP_ID_HERE","PASTE_API_KEY_HERE","PASTE_SENDER_ID_HERE","PASTE_APP_ID_HERE","YOUR_API_KEY","GET_FROM_CONSOLE"];
export const FIREBASE_READY =
  !!cfg.apiKey   && !MISSING_PLACEHOLDER.includes(cfg.apiKey) &&
  !!cfg.appId    && !MISSING_PLACEHOLDER.includes(cfg.appId);

// ── Initialise (or skip if not configured) ───────────────────
let _app, _auth, _db;

if (FIREBASE_READY) {
  _app  = initializeApp(cfg);
  _auth = getAuth(_app);
  _db   = cfg.databaseId ? getFirestore(_app, cfg.databaseId) : getFirestore(_app);

  // Enable offline persistence (best effort)
  enableIndexedDbPersistence(_db).catch(e => {
    if (e.code !== "failed-precondition" && e.code !== "unimplemented") {
      console.warn("[PathGuard] Firestore offline persistence:", e.code);
    }
  });

  console.log(`%c[PathGuard] Firebase connected — project: ${cfg.projectId}`, "color:#22c55e;font-weight:bold");
} else {
  console.warn("[PathGuard] Firebase not configured. Running in demo mode. Update .env to connect.");
}

export const auth          = _auth;
export const db            = _db;
export const googleProvider = FIREBASE_READY ? new GoogleAuthProvider() : null;

// ════════════════════════════════════════════════════════════
// AUTH HELPERS
// ════════════════════════════════════════════════════════════

/** Register a new user and create Firestore profile */
export async function registerUser(name, email, password, role) {
  if (!FIREBASE_READY) throw new Error("Firebase not configured.");
  const cred   = await createUserWithEmailAndPassword(_auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  const avatar = name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  await setDoc(doc(_db, "users", cred.user.uid), {
    uid: cred.user.uid, name, email, role, avatar,
    createdAt: serverTimestamp()
  });
  return cred.user;
}

/** Sign in with email + password */
export async function loginEmail(email, password) {
  if (!FIREBASE_READY) throw new Error("Firebase not configured.");
  const cred = await signInWithEmailAndPassword(_auth, email, password);
  return cred.user;
}

/** Sign in with Google popup, upsert Firestore profile */
export async function loginGoogle() {
  if (!FIREBASE_READY) throw new Error("Firebase not configured.");
  const cred = await signInWithPopup(_auth, googleProvider);
  const ref  = doc(_db, "users", cred.user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const n = cred.user.displayName || "Google User";
    await setDoc(ref, {
      uid: cred.user.uid, name: n, email: cred.user.email,
      role: "Security Analyst",
      avatar: n.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase(),
      createdAt: serverTimestamp()
    });
  }
  return cred.user;
}

/** Sign out */
export const logout = () => FIREBASE_READY ? signOut(_auth) : Promise.resolve();

/** Send password reset email */
export async function resetPassword(email) {
  if (!FIREBASE_READY) throw new Error("Firebase not configured.");
  await sendPasswordResetEmail(_auth, email);
}

/** Get Firestore user profile */
export async function getUserProfile(uid) {
  if (!FIREBASE_READY) return null;
  const snap = await getDoc(doc(_db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/** Subscribe to auth state changes */
export function onAuth(callback) {
  if (!FIREBASE_READY) { callback(null); return () => {}; }
  return onAuthStateChanged(_auth, callback);
}

// ════════════════════════════════════════════════════════════
// FIRESTORE DATA HELPERS
// ════════════════════════════════════════════════════════════

/** Save simulation result to Firestore */
export async function saveSimulation(uid, result) {
  if (!FIREBASE_READY || !uid) return null;
  const ref = await addDoc(collection(_db, "simulations"), {
    uid,
    identityId:   result.identity.id,
    identityName: result.identity.name,
    maxRisk:      result.maxRisk,
    criticalPaths:result.criticalPaths,
    reachableAssets: result.reachableAssets,
    escalations:  result.escalationOpportunities,
    accessType:   result.accessType  || "phishing",
    targetScope:  result.targetScope || "all",
    createdAt:    serverTimestamp()
  });
  return ref.id;
}

/** Get all simulations for a user */
export async function getUserSimulations(uid) {
  if (!FIREBASE_READY) return [];
  const q    = query(
    collection(_db, "simulations"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Save a remediation action */
export async function saveRemediationAction(uid, remId, action) {
  if (!FIREBASE_READY || !uid) return;
  await setDoc(doc(_db, "remediations", `${uid}_${remId}`), {
    uid, remId, action, createdAt: serverTimestamp()
  });
}

/** Get all remediation actions for a user */
export async function getRemediationActions(uid) {
  if (!FIREBASE_READY) return [];
  const q    = query(collection(_db, "remediations"), where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

/** Update user profile */
export async function updateUserProfile(uid, updates) {
  if (!FIREBASE_READY || !uid) return;
  await setDoc(doc(_db, "users", uid), updates, { merge: true });
}

// ════════════════════════════════════════════════════════════
// FIRESTORE SEED  (runs once per project — idempotent)
// ════════════════════════════════════════════════════════════

/** Seed Firestore with demo data on first run */
export async function seedIfEmpty() {
  if (!FIREBASE_READY) return;
  const meta = await getDoc(doc(_db, "meta", "seeded"));
  if (meta.exists()) {
    console.log("[PathGuard] Firestore already seeded.");
    return;
  }
  console.log("[PathGuard] Seeding Firestore with demo data…");
  const PG = window.PG;
  const batch = writeBatch(_db);

  PG.identities.forEach(i =>
    batch.set(doc(_db, "identities", i.id), { ...i, seeded: true })
  );
  PG.groups.forEach(g =>
    batch.set(doc(_db, "groups", g.id), { ...g, seeded: true })
  );
  PG.assets.forEach(a =>
    batch.set(doc(_db, "assets", a.id), { ...a, seeded: true })
  );
  PG.cloudRoles.forEach(r =>
    batch.set(doc(_db, "cloudRoles", r.id), { ...r, seeded: true })
  );
  PG.attackPaths.forEach(p =>
    batch.set(doc(_db, "attackPaths", p.id), {
      id: p.id, severity: p.severity,
      sourceId: p.sourceId, sourceName: p.sourceName,
      targetId: p.targetId, targetName: p.targetName,
      hops: p.hops, risk: p.risk, status: p.status,
      description: p.description,
      stepsCount: p.steps.length,
      seeded: true
    })
  );
  PG.remediations.forEach(r =>
    batch.set(doc(_db, "remediations_template", r.id), { ...r, steps: undefined, seeded: true })
  );

  // KPIs snapshot
  batch.set(doc(_db, "kpis", "latest"), {
    ...PG.kpis, updatedAt: serverTimestamp()
  });

  // Mark as seeded
  batch.set(doc(_db, "meta", "seeded"), {
    at: serverTimestamp(), version: "1.0"
  });

  await batch.commit();
  console.log("[PathGuard] Firestore seeded successfully ✓");
}
