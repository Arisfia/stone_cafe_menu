"use client";

import { useEffect, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { changeAdminPassword, sendAdminPasswordReset } from "@/lib/firebase/auth";
import { getAdminAppData, saveSettings } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { useAdminLocale } from "@/components/admin/admin-preferences";
import type { AppearanceSettings, GeneralSettings, MenuSettings } from "@/types/models";
import { defaultAppearanceSettings, defaultGeneralSettings, defaultMenuSettings } from "@/data/default-data";

export function SettingsManager() {
  const { text } = useAdminLocale();
  const [general, setGeneral] = useState<GeneralSettings>(defaultGeneralSettings);
  const [menu, setMenu] = useState<MenuSettings>(defaultMenuSettings);
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminAppData().then((data) => {
      setGeneral(data.general);
      setMenu(data.menu);
      setAppearance(data.appearance);
    });
  }, []);

  async function saveAll() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await Promise.all([
        saveSettings("general", general as unknown as Record<string, unknown>),
        saveSettings("menu", menu as unknown as Record<string, unknown>),
        saveSettings("appearance", appearance as unknown as Record<string, unknown>)
      ]);
      setMessage(text.settingsSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError(text.passwordsMustMatch);
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}/.test(newPassword)) {
      setError(text.passwordRequirements);
      return;
    }
    const user = getFirebaseAuth()?.currentUser;
    if (!user) {
      setError(text.authExpired);
      return;
    }
    try {
      await changeAdminPassword(user, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(text.passwordChanged);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.passwordChangeFailed);
    }
  }

  async function sendReset() {
    const email = getFirebaseAuth()?.currentUser?.email;
    if (!email) return;
    await sendAdminPasswordReset(email);
    setMessage(text.resetSent);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{text.settings}</h1>
        <p className="text-muted-foreground">{text.settingsDescription}</p>
      </div>
      {message ? <p className="rounded-md border border-primary p-3 text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive p-3 text-destructive">{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>{text.generalSettings}</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={text.restaurantNameEnglish}><Input value={general.restaurantName.en} onChange={(e) => setGeneral({ ...general, restaurantName: { ...general.restaurantName, en: e.target.value } })} /></Field>
            <Field label={text.restaurantNameArabic}><Input dir="rtl" value={general.restaurantName.ar} onChange={(e) => setGeneral({ ...general, restaurantName: { ...general.restaurantName, ar: e.target.value } })} /></Field>
            <Field label={text.restaurantNameKurdish}><Input dir="rtl" value={general.restaurantName.ckb} onChange={(e) => setGeneral({ ...general, restaurantName: { ...general.restaurantName, ckb: e.target.value } })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={text.englishDescription}><Textarea value={general.description.en || ""} onChange={(e) => setGeneral({ ...general, description: { ...general.description, en: e.target.value } })} /></Field>
            <Field label={text.arabicDescription}><Textarea dir="rtl" value={general.description.ar || ""} onChange={(e) => setGeneral({ ...general, description: { ...general.description, ar: e.target.value } })} /></Field>
            <Field label={text.kurdishDescription}><Textarea dir="rtl" value={general.description.ckb || ""} onChange={(e) => setGeneral({ ...general, description: { ...general.description, ckb: e.target.value } })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={text.phone}><Input value={general.phone || ""} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} /></Field>
            <Field label={text.whatsapp}><Input value={general.whatsapp || ""} onChange={(e) => setGeneral({ ...general, whatsapp: e.target.value })} /></Field>
            <Field label={text.email}><Input type="email" value={general.email || ""} onChange={(e) => setGeneral({ ...general, email: e.target.value })} /></Field>
          </div>
          <Field label={text.address}><Input value={general.address || ""} onChange={(e) => setGeneral({ ...general, address: e.target.value })} /></Field>
          <Field label={text.googleMapsUrl}><Input value={general.googleMapsUrl || ""} onChange={(e) => setGeneral({ ...general, googleMapsUrl: e.target.value })} /></Field>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Facebook"><Input value={general.socialLinks?.facebook || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, facebook: e.target.value } })} /></Field>
            <Field label="Instagram"><Input value={general.socialLinks?.instagram || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, instagram: e.target.value } })} /></Field>
            <Field label="TikTok"><Input value={general.socialLinks?.tiktok || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, tiktok: e.target.value } })} /></Field>
            <Field label="Snapchat"><Input value={general.socialLinks?.snapchat || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, snapchat: e.target.value } })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUploadField label={text.logo} text={text} path="restaurants/main/logo" imageUrl={general.logoUrl} onUploaded={(result) => setGeneral({ ...general, logoUrl: result.imageUrl, logoPath: result.imagePath })} />
            <ImageUploadField label={text.coverImage} text={text} path="restaurants/main/cover" imageUrl={general.coverImageUrl} onUploaded={(result) => setGeneral({ ...general, coverImageUrl: result.imageUrl, coverImagePath: result.imagePath })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={text.defaultLanguage}>
              <Select value={general.defaultLanguage} onChange={(e) => setGeneral({ ...general, defaultLanguage: e.target.value as GeneralSettings["defaultLanguage"] })}>
                <option value="ckb">{text.kurdish}</option>
                <option value="ar">{text.arabic}</option>
                <option value="en">{text.english}</option>
              </Select>
            </Field>
            <Field label={text.defaultCurrency}>
              <Select value={general.defaultCurrency} onChange={(e) => setGeneral({ ...general, defaultCurrency: e.target.value as GeneralSettings["defaultCurrency"] })}>
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{text.menuSettings}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(menu).filter(([key]) => key !== "updatedAt").map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">{menuSettingLabel(key, text)}</span>
              <Switch label={menuSettingLabel(key, text)} checked={Boolean(value)} onCheckedChange={(checked) => setMenu({ ...menu, [key]: checked })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{text.appearanceSettings}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label={text.primaryColor}><Input type="color" value={appearance.primaryColor} onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })} /></Field>
          <Field label={text.secondaryColor}><Input type="color" value={appearance.secondaryColor} onChange={(e) => setAppearance({ ...appearance, secondaryColor: e.target.value })} /></Field>
          <Field label={text.borderRadius}><Input type="number" value={appearance.borderRadius} onChange={(e) => setAppearance({ ...appearance, borderRadius: Number(e.target.value) })} /></Field>
          <Field label={text.defaultTheme}>
            <Select value={appearance.defaultTheme} onChange={(e) => setAppearance({ ...appearance, defaultTheme: e.target.value as AppearanceSettings["defaultTheme"] })}>
              <option value="light">{text.light}</option>
              <option value="dark">{text.dark}</option>
            </Select>
          </Field>
          <Field label={text.cardStyle}>
            <Select value={appearance.cardStyle} onChange={(e) => setAppearance({ ...appearance, cardStyle: e.target.value as AppearanceSettings["cardStyle"] })}>
              <option value="flat">{text.flat}</option>
              <option value="outlined">{text.outlined}</option>
              <option value="elevated">{text.elevated}</option>
            </Select>
          </Field>
          <Field label={text.headerLayout}>
            <Select value={appearance.headerLayout} onChange={(e) => setAppearance({ ...appearance, headerLayout: e.target.value as AppearanceSettings["headerLayout"] })}>
              <option value="compact">{text.compact}</option>
              <option value="expanded">{text.expanded}</option>
            </Select>
          </Field>
          <Field label={text.menuLayout}>
            <Select value={appearance.menuLayout} onChange={(e) => setAppearance({ ...appearance, menuLayout: e.target.value as AppearanceSettings["menuLayout"] })}>
              <option value="list">{text.list}</option>
              <option value="grid">{text.grid}</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Button onClick={saveAll} disabled={saving}>{saving ? text.saving : text.saveSettings}</Button>

      <Card>
        <CardHeader><CardTitle>{text.adminPassword}</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePasswordChange}>
            <Field label={text.currentPassword}><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
            <Field label={text.newPassword}><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
            <Field label={text.confirmNewPassword}><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></Field>
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit">{text.changePassword}</Button>
              <Button type="button" variant="outline" onClick={sendReset}>{text.sendForgotPasswordEmail}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function menuSettingLabel(key: string, text: Record<string, string>) {
  return text[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}
