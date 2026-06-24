import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { getFirebaseConfig, hasFirebaseClientConfig } from "@/lib/firebase/client";

// Create the Firebase Auth account for a new staff member without signing the
// current admin out. We spin up a throwaway secondary Firebase app, create the
// user there, sign that app out, then delete it. The caller writes the matching
// adminProfiles/{uid} document (which the admin is allowed to do by the rules).
export async function createStaffAuthUser(email: string, password: string): Promise<string> {
  if (!hasFirebaseClientConfig()) throw new Error("Firebase Authentication is not configured.");

  const secondaryApp = initializeApp(getFirebaseConfig(), `staff-create-${Date.now()}`);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await signOut(secondaryAuth);
    return credential.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
