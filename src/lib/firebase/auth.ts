import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";

export async function signInAdmin(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not configured.");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const isAdmin = await verifyApprovedAdmin(credential.user.uid);
  if (!isAdmin) {
    await signOut(auth);
    throw new Error("This account is not approved for admin access.");
  }
  return credential.user;
}

export async function verifyApprovedAdmin(uid: string) {
  const db = getFirebaseDb();
  if (!db) return false;
  const profile = await getDoc(doc(db, "adminProfiles", uid));
  if (!profile.exists()) return false;
  const data = profile.data();
  return data.isAdmin === true && data.disabled !== true;
}

export async function logoutAdmin() {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
}

export async function sendAdminPasswordReset(email: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not configured.");
  await sendPasswordResetEmail(auth, email);
}

export async function changeAdminPassword(user: User, currentPassword: string, newPassword: string) {
  if (!user.email) throw new Error("The current admin account has no email address.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}
