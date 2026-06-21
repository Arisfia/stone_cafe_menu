"use client";

import { LanguageSelector } from "@/components/menu/language-selector";
import { ThemeToggle } from "@/components/menu/theme-toggle";
import { useLocale } from "@/hooks/use-locale";
import type { Locale } from "@/types/models";

export const adminText: Record<
  Locale,
  {
    brand: string;
    dashboard: string;
    categories: string;
    menuItems: string;
    qrCode: string;
    settings: string;
    logout: string;
    firebaseRequiredTitle: string;
    firebaseRequiredDescription: string;
    viewPublicMenu: string;
    checkingSession: string;
    redirecting: string;
    loginTitle: string;
    loginDescription: string;
    missingFirebase: string;
    email: string;
    password: string;
    showPassword: string;
    enterEmailFirst: string;
    resetSent: string;
    resetFailed: string;
    loginFailed: string;
    signingIn: string;
    signIn: string;
    forgotPassword: string;
    invalidCredential: string;
    tooManyRequests: string;
    authFailed: string;
  }
> = {
  en: {
    brand: "Ary Menu Admin",
    dashboard: "Dashboard",
    categories: "Categories",
    menuItems: "Menu Items",
    qrCode: "QR Code",
    settings: "Settings",
    logout: "Logout",
    firebaseRequiredTitle: "Firebase configuration required",
    firebaseRequiredDescription:
      "Admin pages require Firebase Authentication and Firestore. Add the values in `.env.local`, create an approved /adminProfiles/uid document, then restart the dev server.",
    viewPublicMenu: "View public menu",
    checkingSession: "Checking admin session...",
    redirecting: "Redirecting...",
    loginTitle: "Admin Login",
    loginDescription: "Use an approved Firebase admin account. Public registration is disabled.",
    missingFirebase: "Firebase client environment variables are missing. Add `.env.local` before signing in.",
    email: "Email",
    password: "Password",
    showPassword: "Show or hide password",
    enterEmailFirst: "Enter your email first.",
    resetSent: "Password reset email sent.",
    resetFailed: "Password reset failed.",
    loginFailed: "Login failed.",
    signingIn: "Signing in...",
    signIn: "Sign in",
    forgotPassword: "Forgot password",
    invalidCredential: "Email or password is incorrect.",
    tooManyRequests: "Too many attempts. Try again later.",
    authFailed: "Authentication failed. Check your details and try again."
  },
  ar: {
    brand: "إدارة قائمة آري",
    dashboard: "لوحة التحكم",
    categories: "الأقسام",
    menuItems: "عناصر القائمة",
    qrCode: "رمز QR",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    firebaseRequiredTitle: "إعدادات Firebase مطلوبة",
    firebaseRequiredDescription:
      "صفحات الإدارة تحتاج إلى Firebase Authentication و Firestore. أضف القيم في `.env.local`، وأنشئ مستند /adminProfiles/uid معتمد، ثم أعد تشغيل خادم التطوير.",
    viewPublicMenu: "عرض القائمة العامة",
    checkingSession: "جار التحقق من جلسة الإدارة...",
    redirecting: "جار التحويل...",
    loginTitle: "تسجيل دخول الإدارة",
    loginDescription: "استخدم حساب Firebase إداري معتمد. التسجيل العام غير مفعل.",
    missingFirebase: "متغيرات بيئة Firebase الخاصة بالعميل غير موجودة. أضف `.env.local` قبل تسجيل الدخول.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    showPassword: "إظهار أو إخفاء كلمة المرور",
    enterEmailFirst: "أدخل بريدك الإلكتروني أولا.",
    resetSent: "تم إرسال بريد إعادة تعيين كلمة المرور.",
    resetFailed: "فشلت إعادة تعيين كلمة المرور.",
    loginFailed: "فشل تسجيل الدخول.",
    signingIn: "جار تسجيل الدخول...",
    signIn: "تسجيل الدخول",
    forgotPassword: "نسيت كلمة المرور",
    invalidCredential: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    tooManyRequests: "محاولات كثيرة. حاول لاحقا.",
    authFailed: "فشلت المصادقة. تحقق من البيانات وحاول مرة أخرى."
  },
  ckb: {
    brand: "بەڕێوەبردنی مینیوی ئاری",
    dashboard: "داشبۆرد",
    categories: "بەشەکان",
    menuItems: "بابەتەکانی مینیو",
    qrCode: "کۆدی QR",
    settings: "ڕێکخستنەکان",
    logout: "چوونەدەرەوە",
    firebaseRequiredTitle: "ڕێکخستنی Firebase پێویستە",
    firebaseRequiredDescription:
      "پەڕەکانی بەڕێوەبردن پێویستیان بە Firebase Authentication و Firestore هەیە. نرخەکان لە `.env.local` زیاد بکە، دۆکیومێنتی /adminProfiles/uid ی پەسەند دروست بکە، پاشان سێرڤەری گەشەپێدان دووبارە پێبکە.",
    viewPublicMenu: "بینینی مینیوی گشتی",
    checkingSession: "پشکنینی دانیشتنی بەڕێوەبردن...",
    redirecting: "گواستنەوە...",
    loginTitle: "چوونەژوورەوەی بەڕێوەبردن",
    loginDescription: "هەژمارێکی Firebase ی بەڕێوەبەری پەسەندکراو بەکاربهێنە. تۆمارکردنی گشتی ناچالاکە.",
    missingFirebase: "گۆڕاوەکانی ژینگەی Firebase ی کلایەنت نییە. پێش چوونەژوورەوە `.env.local` زیاد بکە.",
    email: "ئیمەیل",
    password: "وشەی نهێنی",
    showPassword: "نیشاندان یان شاردنەوەی وشەی نهێنی",
    enterEmailFirst: "سەرەتا ئیمەیلەکەت بنووسە.",
    resetSent: "ئیمەیلی نوێکردنەوەی وشەی نهێنی نێردرا.",
    resetFailed: "نوێکردنەوەی وشەی نهێنی سەرکەوتوو نەبوو.",
    loginFailed: "چوونەژوورەوە سەرکەوتوو نەبوو.",
    signingIn: "چوونەژوورەوە...",
    signIn: "چوونەژوورەوە",
    forgotPassword: "وشەی نهێنیت لەبیر کردووە",
    invalidCredential: "ئیمەیل یان وشەی نهێنی هەڵەیە.",
    tooManyRequests: "هەوڵی زۆر دراوە. دواتر هەوڵ بدەوە.",
    authFailed: "پەسەندکردن سەرکەوتوو نەبوو. زانیارییەکان بپشکنە و دووبارە هەوڵ بدەوە."
  }
};

export function useAdminLocale() {
  const { locale, setLocale } = useLocale();
  return { locale, setLocale, text: adminText[locale] };
}

export function AdminPreferences({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useAdminLocale();

  return (
    <div className={compact ? "flex shrink-0 items-center gap-2" : "space-y-3"}>
      <LanguageSelector locale={locale} onChange={setLocale} />
      <ThemeToggle />
    </div>
  );
}
