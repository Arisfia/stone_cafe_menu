import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions
} from "firebase/firestore";
import { defaultAppData } from "@/data/default-data";
import { getFirebaseDb } from "@/lib/firebase/client";
import { removeImage } from "@/lib/supabase/storage";
import { slugify } from "@/lib/utils/format";
import type { AdminPermissions, AdminProfile, AdminRole, AppData, Category, Expense, MenuItem, PosState, PosTableArea } from "@/types/models";

function converter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: T) {
      const data = { ...modelObject } as Partial<T>;
      delete data.id;
      return stripUndefined(data);
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return { id: snapshot.id, ...snapshot.data(options) } as T;
    }
  };
}

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as T;
  }
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefined(entry)])
  ) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const categoryConverter = converter<Category>();
const itemConverter = converter<MenuItem>();
const expenseConverter = converter<Expense>();

const defaultPosState: PosState = {
  tables: Array.from({ length: 8 }, (_, index) => ({
    id: `table-${index + 1}`,
    name: index < 6 ? `Indoor ${index + 1}` : `Outdoor ${index - 5}`,
    area: index < 6 ? "indoor" : "outdoor",
    displayOrder: index,
    isActive: true
  })),
  orders: {},
  completedOrders: []
};

export async function getPublicAppData(): Promise<AppData> {
  const db = getFirebaseDb();
  if (!db) return defaultAppData;

  const [categorySnap, itemSnap, generalSnap, menuSnap, appearanceSnap, qrSnap] = await Promise.all([
    getDocs(query(collection(db, "categories").withConverter(categoryConverter), where("isActive", "==", true), orderBy("displayOrder"), limit(100))),
    getDocs(query(collection(db, "menuItems").withConverter(itemConverter), where("isAvailable", "==", true), orderBy("displayOrder"), limit(200))),
    getDoc(doc(db, "settings", "general")),
    getDoc(doc(db, "settings", "menu")),
    getDoc(doc(db, "settings", "appearance")),
    getDoc(doc(db, "settings", "qr"))
  ]);

  return {
    categories: categorySnap.docs.map((entry) => entry.data()),
    menuItems: itemSnap.docs.map((entry) => {
      const item = { ...entry.data() };
      delete item.imageHistory;
      return item;
    }),
    general: generalSnap.exists() ? { ...defaultAppData.general, ...generalSnap.data() } : defaultAppData.general,
    menu: menuSnap.exists() ? { ...defaultAppData.menu, ...menuSnap.data() } : defaultAppData.menu,
    appearance: appearanceSnap.exists() ? { ...defaultAppData.appearance, ...appearanceSnap.data() } : defaultAppData.appearance,
    qr: qrSnap.exists() ? { ...defaultAppData.qr, ...qrSnap.data() } : defaultAppData.qr
  };
}

export async function getAdminAppData(): Promise<AppData> {
  const db = getFirebaseDb();
  if (!db) return defaultAppData;

  const [categorySnap, itemSnap, generalSnap, menuSnap, appearanceSnap, qrSnap] = await Promise.all([
    getDocs(query(collection(db, "categories").withConverter(categoryConverter), orderBy("displayOrder"), limit(200))),
    getDocs(query(collection(db, "menuItems").withConverter(itemConverter), orderBy("displayOrder"), limit(500))),
    getDoc(doc(db, "settings", "general")),
    getDoc(doc(db, "settings", "menu")),
    getDoc(doc(db, "settings", "appearance")),
    getDoc(doc(db, "settings", "qr"))
  ]);

  const menuItems = itemSnap.docs.map((entry) => entry.data());
  await Promise.all(menuItems.map((item) => pruneExpiredImageHistory(item, true)));

  return {
    categories: categorySnap.docs.map((entry) => entry.data()),
    menuItems: menuItems.map(withActiveImageHistory),
    general: generalSnap.exists() ? { ...defaultAppData.general, ...generalSnap.data() } : defaultAppData.general,
    menu: menuSnap.exists() ? { ...defaultAppData.menu, ...menuSnap.data() } : defaultAppData.menu,
    appearance: appearanceSnap.exists() ? { ...defaultAppData.appearance, ...appearanceSnap.data() } : defaultAppData.appearance,
    qr: qrSnap.exists() ? { ...defaultAppData.qr, ...qrSnap.data() } : defaultAppData.qr
  };
}

// --- Admin / employee user profiles ---

function toAdminProfile(uid: string, data: Record<string, unknown>): AdminProfile {
  return {
    uid,
    email: typeof data.email === "string" ? data.email : "",
    username: typeof data.username === "string" ? data.username : undefined,
    displayName: typeof data.displayName === "string" ? data.displayName : undefined,
    isAdmin: data.isAdmin === true,
    role: data.role === "employee" ? "employee" : data.role === "admin" ? "admin" : undefined,
    permissions: (data.permissions as AdminPermissions | undefined) || undefined,
    disabled: data.disabled === true
  };
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

// Public username -> email lookup so the login screen can resolve a username to
// an email before the user is authenticated. Requires the `usernames` rule in
// firestore.rules to be deployed.
export async function getUsernameEmail(username: string): Promise<string | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "usernames", normalizeUsername(username)));
  if (!snap.exists()) return null;
  const email = snap.data().email;
  return typeof email === "string" ? email : null;
}

export async function isUsernameAvailable(username: string, exceptUid?: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return true;
  try {
    const snap = await getDoc(doc(db, "usernames", normalizeUsername(username)));
    if (!snap.exists()) return true;
    return snap.data().uid === exceptUid;
  } catch {
    return true; // can't verify (rules not deployed yet) — don't block creation
  }
}

export async function claimUsername(username: string, email: string, uid: string) {
  const db = getFirebaseDb();
  if (!db || !username) return;
  await setDoc(doc(db, "usernames", normalizeUsername(username)), { email, uid });
}

export async function releaseUsername(username: string) {
  const db = getFirebaseDb();
  if (!db || !username) return;
  await deleteDoc(doc(db, "usernames", normalizeUsername(username)));
}

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "adminProfiles", uid));
  if (!snap.exists()) return null;
  return toAdminProfile(uid, snap.data());
}

export async function listAdminProfiles(): Promise<AdminProfile[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(collection(db, "adminProfiles"));
  return snap.docs
    .map((entry) => toAdminProfile(entry.id, entry.data()))
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function saveAdminProfile(profile: {
  uid: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  username?: string;
  displayName?: string;
  disabled?: boolean;
}) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not configured.");
  // isAdmin stays true for every staff member so the current Firestore rules
  // grant them admin-data access; the role + permissions drive the UI gating.
  await setDoc(
    doc(db, "adminProfiles", profile.uid),
    stripUndefined({
      email: profile.email,
      username: profile.username ? normalizeUsername(profile.username) : undefined,
      displayName: profile.displayName,
      isAdmin: true,
      role: profile.role,
      permissions: profile.role === "employee" ? profile.permissions : {},
      disabled: profile.disabled === true,
      updatedAt: serverTimestamp()
    }),
    { merge: true }
  );
}

export async function setAdminProfileDisabled(uid: string, disabled: boolean) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not configured.");
  await updateDoc(doc(db, "adminProfiles", uid), { disabled, updatedAt: serverTimestamp() });
}

export async function deleteAdminProfile(uid: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, "adminProfiles", uid));
}

export async function saveCategory(category: Category) {
  const db = getFirebaseDb();
  if (!db) return;
  const payload = {
    ...category,
    slug: category.slug || slugify(category.name.en),
    updatedAt: serverTimestamp(),
    createdAt: category.createdAt || serverTimestamp()
  };
  if (category.id) {
    await setDoc(doc(db, "categories", category.id).withConverter(categoryConverter), payload);
  } else {
    await addDoc(collection(db, "categories").withConverter(categoryConverter), payload);
  }
}

export async function deleteCategory(categoryId: string) {
  const db = getFirebaseDb();
  if (!db) return;
  await deleteDoc(doc(db, "categories", categoryId));
}

export async function updateCategoryActive(categoryId: string, isActive: boolean) {
  const db = getFirebaseDb();
  if (!db) return;
  await updateDoc(doc(db, "categories", categoryId), { isActive, updatedAt: serverTimestamp() });
}

export async function saveMenuItem(item: MenuItem) {
  const db = getFirebaseDb();
  if (!db) return;
  await pruneExpiredImageHistory(item, false);
  const payload = {
    ...withActiveImageHistory(item),
    updatedAt: serverTimestamp(),
    createdAt: item.createdAt || serverTimestamp()
  };
  if (item.id) {
    await setDoc(doc(db, "menuItems", item.id).withConverter(itemConverter), payload);
  } else {
    await addDoc(collection(db, "menuItems").withConverter(itemConverter), payload);
  }
}

export async function updateMenuItemAvailability(itemId: string, isAvailable: boolean) {
  const db = getFirebaseDb();
  if (!db) return;
  await updateDoc(doc(db, "menuItems", itemId), { isAvailable, updatedAt: serverTimestamp() });
}

async function pruneExpiredImageHistory(item: MenuItem, persist: boolean) {
  const expired = (item.imageHistory || []).filter((entry) => isExpired(entry.expiresAt));
  if (!expired.length) return;
  await Promise.allSettled(expired.map((entry) => removeImage(entry.imagePath)));
  if (persist && item.id) {
    const db = getFirebaseDb();
    if (db) await updateDoc(doc(db, "menuItems", item.id), { imageHistory: withActiveImageHistory(item).imageHistory || [] });
  }
}

function withActiveImageHistory(item: MenuItem): MenuItem {
  return {
    ...item,
    imageHistory: (item.imageHistory || []).filter((entry) => !isExpired(entry.expiresAt))
  };
}

function isExpired(value: string) {
  return Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now();
}

export async function deleteMenuItem(itemId: string) {
  const db = getFirebaseDb();
  if (!db) return;
  await deleteDoc(doc(db, "menuItems", itemId));
}

export async function listExpenses(): Promise<Expense[]> {
  const db = getFirebaseDb();
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "expenses").withConverter(expenseConverter), orderBy("date", "desc"), limit(500)));
  return snap.docs.map((entry) => entry.data());
}

export async function saveExpense(expense: Expense) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not configured.");
  const payload = {
    ...expense,
    updatedAt: serverTimestamp(),
    createdAt: expense.createdAt || serverTimestamp()
  };
  if (expense.id) {
    await setDoc(doc(db, "expenses", expense.id).withConverter(expenseConverter), payload);
  } else {
    await addDoc(collection(db, "expenses").withConverter(expenseConverter), payload);
  }
}

export async function deleteExpense(expenseId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, "expenses", expenseId));
}

export async function saveSettings(section: "general" | "menu" | "appearance" | "qr", value: Record<string, unknown>) {
  const db = getFirebaseDb();
  if (!db) return;
  await updateDoc(doc(db, "settings", section), { ...value, updatedAt: serverTimestamp() }).catch(async () => {
    await setDoc(doc(db, "settings", section), { ...value, updatedAt: serverTimestamp() });
  });
}

export async function getPosState(): Promise<PosState> {
  const db = getFirebaseDb();
  if (!db) return defaultPosState;
  const snap = await getDoc(doc(db, "settings", "pos"));
  if (!snap.exists()) return defaultPosState;
  return normalizePosState(snap.data());
}

export async function savePosState(state: PosState) {
  const db = getFirebaseDb();
  if (!db) return;
  await setDoc(doc(db, "settings", "pos"), { ...serializePosState(state), updatedAt: serverTimestamp() }, { merge: true });
}

function normalizePosState(value: unknown): PosState {
  const data = value && typeof value === "object" ? value as Partial<PosState> : {};
  const tables = Array.isArray(data.tables) && data.tables.length ? data.tables : defaultPosState.tables;
  const orders = data.orders && typeof data.orders === "object" ? data.orders : {};
  const completedOrders = Array.isArray(data.completedOrders) ? data.completedOrders : [];
  return {
    tables: tables
      .filter((table) => table && typeof table.id === "string" && typeof table.name === "string")
      .map((table, index) => ({
        id: table.id,
        name: table.name,
        area: normalizeTableArea(table.area),
        displayOrder: Number.isFinite(table.displayOrder) ? table.displayOrder : index,
        isActive: table.isActive !== false
      })),
    orders: Object.fromEntries(
      Object.entries(orders)
        .filter((entry): entry is [string, PosState["orders"][string]] => {
          const order = entry[1];
          return Boolean(order && typeof order === "object" && Array.isArray(order.lines));
        })
        .map(([tableId, order]) => {
          const normalizedOrder: PosState["orders"][string] = {
            tableId,
            lines: order.lines.filter((line) => line && typeof line.id === "string" && typeof line.itemId === "string"),
            discountType: order.discountType === "percent" ? "percent" : "amount",
            discountValue: Number.isFinite(order.discountValue) ? Math.max(0, order.discountValue) : 0
          };
          if (typeof order.updatedAt === "string") normalizedOrder.updatedAt = order.updatedAt;
          return [tableId, normalizedOrder];
        })
    ),
    completedOrders: completedOrders
      .filter((order) => order && typeof order.id === "string" && typeof order.tableId === "string" && Array.isArray(order.lines))
      .map((order) => ({
        id: order.id,
        tableId: order.tableId,
        tableName: typeof order.tableName === "string" ? order.tableName : order.tableId,
        lines: order.lines.filter((line) => line && typeof line.id === "string" && typeof line.itemId === "string"),
        discountType: order.discountType === "percent" ? "percent" : "amount",
        discountValue: Number.isFinite(order.discountValue) ? Math.max(0, order.discountValue) : 0,
        subtotal: Number.isFinite(order.subtotal) ? Math.max(0, order.subtotal) : 0,
        discountAmount: Number.isFinite(order.discountAmount) ? Math.max(0, order.discountAmount) : 0,
        total: Number.isFinite(order.total) ? Math.max(0, order.total) : 0,
        currency: order.currency || "IQD",
        completedAt: typeof order.completedAt === "string" ? order.completedAt : new Date().toISOString()
      }))
  };
}

function normalizeTableArea(value: unknown): PosTableArea {
  return value === "outdoor" ? "outdoor" : "indoor";
}

function serializePosState(state: PosState) {
  const normalized = normalizePosState(state);
  return {
    tables: normalized.tables,
    orders: Object.fromEntries(
      Object.entries(normalized.orders).map(([tableId, order]) => {
        const payload: PosState["orders"][string] = {
          tableId: order.tableId || tableId,
          lines: order.lines,
          discountType: order.discountType,
          discountValue: order.discountValue
        };
        if (typeof order.updatedAt === "string") payload.updatedAt = order.updatedAt;
        return [tableId, payload];
      })
    ),
    completedOrders: normalized.completedOrders || []
  };
}
