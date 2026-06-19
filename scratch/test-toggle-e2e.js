const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

admin.initializeApp({ projectId: "demo-mock-project" });

const db = admin.firestore();
const auth = admin.auth();

async function runTest() {
  try {
    console.log("1. Authenticating as Org Admin via Auth Emulator REST API...");
    const authRes = await fetch(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=mock-api-key-for-local-emulator-suite-12345",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "orgadmin@demo.io",
          password: "Demo@1234",
          returnSecureToken: true,
        }),
      }
    );
    if (!authRes.ok) {
      throw new Error(`Auth failed: ${authRes.statusText}`);
    }
    const authData = await authRes.json();
    const idToken = authData.idToken;
    console.log("✓ Authenticated. Token acquired.");

    const testToggle = async (nextStatus) => {
      console.log(`\n2. Toggling status to '${nextStatus}'...`);
      const toggleRes = await fetch(
        "http://127.0.0.1:5001/demo-mock-project/us-central1/toggleUserTenantStatusHttp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            tenantId: "tenant_demo",
            userId: "demo_employee",
            nextStatus: nextStatus,
          }),
        }
      );

      if (!toggleRes.ok) {
        const errBody = await toggleRes.json().catch(() => ({}));
        throw new Error(`Toggle HTTP request failed: ${toggleRes.status} - ${JSON.stringify(errBody)}`);
      }

      console.log("✓ Toggle request succeeded.");

      console.log("3. Verifying in Firestore...");
      const docSnap = await db.collection("users").doc("demo_employee").get();
      const dbStatus = docSnap.data()?.tenants?.["tenant_demo"]?.status;
      console.log(`Firestore Status: ${dbStatus}`);
      if (dbStatus !== nextStatus) {
        throw new Error(`Firestore status mismatch! Expected ${nextStatus}, got ${dbStatus}`);
      }

      console.log("4. Verifying in Firebase Auth...");
      const authUser = await auth.getUser("demo_employee");
      const authDisabled = authUser.disabled;
      const expectedDisabled = nextStatus === "disabled";
      console.log(`Auth User Disabled Flag: ${authDisabled}`);
      if (authDisabled !== expectedDisabled) {
        throw new Error(`Auth disabled status mismatch! Expected ${expectedDisabled}, got ${authDisabled}`);
      }
      console.log("✓ Verification successful for this state.");
    };

    // Test disabling
    await testToggle("disabled");

    // Test enabling back
    await testToggle("active");

    console.log("\n🎉 ALL TESTS PASSED: Toggle works end-to-end and updates Firestore & Auth correctly! 🎉");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

runTest();
