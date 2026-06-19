const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

admin.initializeApp({ projectId: "demo-mock-project" });

const db = admin.firestore();
const auth = admin.auth();

async function verify() {
  try {
    const docSnap = await db.collection("users").doc("demo_employee").get();
    if (!docSnap.exists) {
      console.log("Firestore document users/demo_employee does not exist.");
    } else {
      const data = docSnap.data();
      console.log("Firestore user status:", JSON.stringify(data.tenants?.["tenant_demo"] || {}, null, 2));
    }

    const authUser = await auth.getUser("demo_employee");
    console.log("Auth user disabled flag:", authUser.disabled);
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

verify();
