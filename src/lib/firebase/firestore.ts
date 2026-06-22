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
import type { AppData, Category, MenuItem } from "@/types/models";

function converter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(modelObject: T) {
      const data = { ...modelObject } as Partial<T>;
      delete data.id;
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return { id: snapshot.id, ...snapshot.data(options) } as T;
    }
  };
}

const categoryConverter = converter<Category>();
const itemConverter = converter<MenuItem>();

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
