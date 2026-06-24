import type { Timestamp } from "firebase/firestore";

export type Locale = "en" | "ar" | "ckb";
export type Currency = "IQD" | "USD" | "EUR" | "TRY";
export type LocalizedText = Record<Locale, string>;
export type OptionalLocalizedText = Partial<Record<Locale, string>>;

export type Category = {
  id: string;
  name: LocalizedText;
  description: OptionalLocalizedText;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type MenuVariant = {
  id: string;
  name: LocalizedText;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
};

export type ImageHistoryEntry = {
  id: string;
  imageUrl: string;
  imagePath: string;
  createdAt: string;
  expiresAt: string;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: LocalizedText;
  description: OptionalLocalizedText;
  ingredients?: OptionalLocalizedText;
  imageUrl?: string;
  imagePath?: string;
  imageHistory?: ImageHistoryEntry[];
  basePrice: number;
  discountPrice?: number;
  currency: Currency;
  preparationMinutes?: number;
  calories?: number;
  spicyLevel?: number;
  dietaryLabels: string[];
  allergens: string[];
  tags: string[];
  variants: MenuVariant[];
  isAvailable: boolean;
  isSoldOut: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  isNew: boolean;
  displayOrder: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type GeneralSettings = {
  restaurantName: LocalizedText;
  description: OptionalLocalizedText;
  logoUrl?: string;
  logoPath?: string;
  coverImageUrl?: string;
  coverImagePath?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  googleMapsUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
  };
  defaultLanguage: Locale;
  enabledLanguages: Locale[];
  defaultCurrency: Currency;
  updatedAt?: Timestamp;
};

export type MenuSettings = {
  showImages: boolean;
  showPrices: boolean;
  showCalories: boolean;
  showIngredients: boolean;
  showAllergens: boolean;
  showSoldOutItems: boolean;
  enableSearch: boolean;
  enableFilters: boolean;
  enableDarkMode: boolean;
  updatedAt?: Timestamp;
};

export type PosDiscountType = "amount" | "percent";

export type PosTable = {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
};

export type PosOrderLine = {
  id: string;
  itemId: string;
  name: LocalizedText;
  quantity: number;
  unitPrice: number;
  currency: Currency;
};

export type PosTableOrder = {
  tableId: string;
  lines: PosOrderLine[];
  discountType: PosDiscountType;
  discountValue: number;
  updatedAt?: string;
};

export type PosState = {
  tables: PosTable[];
  orders: Record<string, PosTableOrder>;
  updatedAt?: Timestamp;
};

export type AppearanceSettings = {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  borderRadius: number;
  cardStyle: "flat" | "outlined" | "elevated";
  headerLayout: "compact" | "expanded";
  menuLayout: "list" | "grid";
  defaultTheme: "light" | "dark";
  updatedAt?: Timestamp;
};

export type QrSettings = {
  menuUrl: string;
  foregroundColor: string;
  backgroundColor: string;
  includeLogo: boolean;
  logoUrl?: string;
  title: LocalizedText;
  subtitle: OptionalLocalizedText;
  updatedAt?: Timestamp;
};

export type AdminProfile = {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  disabled?: boolean;
  createdAt?: Timestamp;
};

export type AppData = {
  categories: Category[];
  menuItems: MenuItem[];
  general: GeneralSettings;
  menu: MenuSettings;
  appearance: AppearanceSettings;
  qr: QrSettings;
};
