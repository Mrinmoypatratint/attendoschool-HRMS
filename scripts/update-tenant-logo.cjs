const { initializeApp } = require("firebase/app");
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, updateDoc, getDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCXgZqRNuQ6Uxue0-1st9zt0lfZwraD3g4",
  authDomain: "attendoschool-2d0fb.firebaseapp.com",
  projectId: "attendoschool-2d0fb",
  storageBucket: "attendoschool-2d0fb.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log("Signing in as admin@greenwood.edu.in...");
  await signInWithEmailAndPassword(auth, "admin@greenwood.edu.in", "Greenwood@2026");
  console.log("Admin signed in.");

  const tenantRef = doc(db, "tenants", "tenant_greenwood");
  const snap = await getDoc(tenantRef);
  if (!snap.exists()) {
    console.error("tenant_greenwood not found!");
    process.exit(1);
  }

  console.log("Current tenant data:", snap.data().name, snap.data().logoUrl, snap.data().logoURL);

  await updateDoc(tenantRef, {
    logoUrl: "/greenwood-logo.png",
    logoURL: "/greenwood-logo.png",
    updatedAt: Date.now(),
  });

  const updatedSnap = await getDoc(tenantRef);
  console.log("Updated tenant data:", updatedSnap.data().name, "logoURL:", updatedSnap.data().logoURL, "logoUrl:", updatedSnap.data().logoUrl);
  console.log("Successfully updated GreenWood logo in production Firestore!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error updating tenant logo:", err);
  process.exit(1);
});
