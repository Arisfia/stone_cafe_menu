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
import type { AppData, Category, MenuItem, PosState, PosTableArea } from "@/types/models";

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
