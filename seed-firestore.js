const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccountKey.json");

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: "identity-security-58adc"
});

// Connect to named database 'indentity'
const db = getFirestore(app, "indentity");

console.log("[PathGuard Node Admin] Connected to Cloud Firestore database: 'indentity'");

// Load data definition from js/data.js mock dataset
const dataJsPath = path.join(__dirname, "js", "data.js");
let dataContent = fs.readFileSync(dataJsPath, "utf8");

// Parse PG object from data.js
const sandbox = { window: {}, PG: {} };
const vm = require("vm");
vm.runInNewContext(dataContent, sandbox);
const PG = sandbox.PG || sandbox.window.PG;

async function seed() {
  console.log("🌱 Starting Firestore seed into database 'indentity'...\n");

  const batch = db.batch();

  // 1. Identities
  if (PG.identities && Array.isArray(PG.identities)) {
    PG.identities.forEach(i => {
      batch.set(db.collection("identities").doc(i.id), { ...i, updatedAt: FieldValue.serverTimestamp() });
    });
    console.log(`  ✓ ${PG.identities.length} Identities queued`);
  }

  // 2. Groups
  if (PG.groups && Array.isArray(PG.groups)) {
    PG.groups.forEach(g => {
      batch.set(db.collection("groups").doc(g.id), { ...g, updatedAt: FieldValue.serverTimestamp() });
    });
    console.log(`  ✓ ${PG.groups.length} Groups queued`);
  }

  // 3. Assets
  if (PG.assets && Array.isArray(PG.assets)) {
    PG.assets.forEach(a => {
      batch.set(db.collection("assets").doc(a.id), { ...a, updatedAt: FieldValue.serverTimestamp() });
    });
    console.log(`  ✓ ${PG.assets.length} Critical Assets queued`);
  }

  // 4. Cloud Roles
  if (PG.cloudRoles && Array.isArray(PG.cloudRoles)) {
    PG.cloudRoles.forEach(r => {
      batch.set(db.collection("cloudRoles").doc(r.id), { ...r, updatedAt: FieldValue.serverTimestamp() });
    });
    console.log(`  ✓ ${PG.cloudRoles.length} Cloud Roles queued`);
  }

  // 5. Attack Paths
  if (PG.attackPaths && Array.isArray(PG.attackPaths)) {
    PG.attackPaths.forEach(p => {
      batch.set(db.collection("attackPaths").doc(p.id), {
        id: p.id,
        severity: p.severity,
        sourceId: p.sourceId,
        sourceName: p.sourceName,
        targetId: p.targetId,
        targetName: p.targetName,
        hops: p.hops,
        risk: p.risk,
        status: p.status,
        description: p.description,
        stepsCount: p.steps ? p.steps.length : 0,
        updatedAt: FieldValue.serverTimestamp()
      });
    });
    console.log(`  ✓ ${PG.attackPaths.length} Attack Paths queued`);
  }

  // 6. KPIs snapshot & Metadata
  if (PG.kpis) {
    batch.set(db.collection("kpis").doc("latest"), { ...PG.kpis, updatedAt: FieldValue.serverTimestamp() });
  }
  batch.set(db.collection("meta").doc("seeded"), {
    at: FieldValue.serverTimestamp(),
    version: "1.0",
    databaseId: "indentity",
    projectId: "identity-security-58adc"
  });

  await batch.commit();
  console.log("\n✅ Firestore database 'indentity' successfully seeded!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Firestore seed failed:", err);
  process.exit(1);
});
