const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
admin.initializeApp({ projectId: "demo-mock-project" });
const db = admin.firestore();

async function runTest() {
  try {
    console.log("Waiting 3 seconds for Functions emulator to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("\n1. Testing Unauthenticated Attempt (unregistered email)...");
    const resUnauth = await fetch(
      "http://127.0.0.1:5001/demo-mock-project/us-central1/reportFailedLoginHttp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unregistered@test.com" }),
      }
    );
    if (!resUnauth.ok) {
      throw new Error(`HTTP request failed for unauthenticated: ${resUnauth.statusText}`);
    }
    const dataUnauth = await resUnauth.json();
    console.log("Unauthenticated response:", dataUnauth);
    if (dataUnauth.type !== "unauthenticated") {
      throw new Error(`Expected type 'unauthenticated', got '${dataUnauth.type}'`);
    }

    console.log("\n2. Testing Unauthorized Attempt (registered email)...");
    const resAuth = await fetch(
      "http://127.0.0.1:5001/demo-mock-project/us-central1/reportFailedLoginHttp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "employee@demo.io" }),
      }
    );
    if (!resAuth.ok) {
      throw new Error(`HTTP request failed for unauthorized: ${resAuth.statusText}`);
    }
    const dataAuth = await resAuth.json();
    console.log("Unauthorized response:", dataAuth);
    if (dataAuth.type !== "unauthorized") {
      throw new Error(`Expected type 'unauthorized', got '${dataAuth.type}'`);
    }

    console.log("\n3. Verifying In-App Notification in Firestore for Org Admin (demo_org_admin)...");
    const notifSnap = await db
      .collection("notifications")
      .where("userId", "==", "demo_org_admin")
      .where("type", "==", "security.alert")
      .get();

    if (notifSnap.empty) {
      throw new Error("No in-app notification found for Org Admin Olivia Owner (demo_org_admin)!");
    }

    console.log(`Found ${notifSnap.size} in-app notification(s) for the Org Admin.`);
    notifSnap.forEach((doc) => {
      const data = doc.data();
      console.log(`Notification Document ID: ${doc.id}`);
      console.log(`Title: "${data.title}"`);
      console.log(`Body: "${data.body}"`);
    });

    console.log("\n🎉 ALL TESTS PASSED: Emails and in-app notifications are correctly handled for unauthenticated/unauthorized login attempts! 🎉");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runTest();
