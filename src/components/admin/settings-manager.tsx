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
import type { AppearanceSettings, GeneralSettings, MenuSettings } from "@/types/models";
import { defaultAppearanceSettings, defaultGeneralSettings, defaultMenuSettings } from "@/data/default-data";

export function SettingsManager() {
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
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("New passwords must match.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}/.test(newPassword)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and a number.");
      return;
    }
    const user = getFirebaseAuth()?.currentUser;
    if (!user) {
      setError("Authentication expired. Sign in again.");
      return;
    }
    try {
      await changeAdminPassword(user, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password change failed.");
    }
  }

  async function sendReset() {
    const email = getFirebaseAuth()?.currentUser?.email;
    if (!email) return;
    await sendAdminPasswordReset(email);
    setMessage("Password reset email sent.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Branding, menu behavior, appearance, and admin password.</p>
      </div>
      {message ? <p className="rounded-md border border-primary p-3 text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive p-3 text-destructive">{error}</p> : null}

      <Card>
        <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Restaurant name English"><Input value={general.restaurantName.en} onChange={(e) => setGeneral({ ...general, restaurantName: { ...general.restaurantName, en: e.target.value } })} /></Field>
            <Field label="Restaurant name Arabic"><Input dir="rtl" value={general.restaurantName.ar} onChange={(e) => setGeneral({ ...general, restaurantName: { ...general.restaurantName, ar: e.target.value } })} /></Field>
            <Field label="Restaurant name Kurdish"><Input dir="rtl" value={general.restaurantName.ckb} onChange={(e) => setGeneral({ ...general, restaurantName: { ...general.restaurantName, ckb: e.target.value } })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Description English"><Textarea value={general.description.en || ""} onChange={(e) => setGeneral({ ...general, description: { ...general.description, en: e.target.value } })} /></Field>
            <Field label="Description Arabic"><Textarea dir="rtl" value={general.description.ar || ""} onChange={(e) => setGeneral({ ...general, description: { ...general.description, ar: e.target.value } })} /></Field>
            <Field label="Description Kurdish"><Textarea dir="rtl" value={general.description.ckb || ""} onChange={(e) => setGeneral({ ...general, description: { ...general.description, ckb: e.target.value } })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Phone"><Input value={general.phone || ""} onChange={(e) => setGeneral({ ...general, phone: e.target.value })} /></Field>
            <Field label="WhatsApp"><Input value={general.whatsapp || ""} onChange={(e) => setGeneral({ ...general, whatsapp: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={general.email || ""} onChange={(e) => setGeneral({ ...general, email: e.target.value })} /></Field>
          </div>
          <Field label="Address"><Input value={general.address || ""} onChange={(e) => setGeneral({ ...general, address: e.target.value })} /></Field>
          <Field label="Google Maps URL"><Input value={general.googleMapsUrl || ""} onChange={(e) => setGeneral({ ...general, googleMapsUrl: e.target.value })} /></Field>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Facebook"><Input value={general.socialLinks?.facebook || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, facebook: e.target.value } })} /></Field>
            <Field label="Instagram"><Input value={general.socialLinks?.instagram || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, instagram: e.target.value } })} /></Field>
            <Field label="TikTok"><Input value={general.socialLinks?.tiktok || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, tiktok: e.target.value } })} /></Field>
            <Field label="Snapchat"><Input value={general.socialLinks?.snapchat || ""} onChange={(e) => setGeneral({ ...general, socialLinks: { ...general.socialLinks, snapchat: e.target.value } })} /></Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUploadField label="Logo" path="restaurants/main/logo" imageUrl={general.logoUrl} onUploaded={(result) => setGeneral({ ...general, logoUrl: result.imageUrl, logoPath: result.imagePath })} />
            <ImageUploadField label="Cover image" path="restaurants/main/cover" imageUrl={general.coverImageUrl} onUploaded={(result) => setGeneral({ ...general, coverImageUrl: result.imageUrl, coverImagePath: result.imagePath })} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Default language">
              <Select value={general.defaultLanguage} onChange={(e) => setGeneral({ ...general, defaultLanguage: e.target.value as GeneralSettings["defaultLanguage"] })}>
                <option value="ckb">Kurdish Sorani</option>
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </Select>
            </Field>
            <Field label="Default currency">
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
        <CardHeader><CardTitle>Menu Settings</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(menu).filter(([key]) => key !== "updatedAt").map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">{labelFromKey(key)}</span>
              <Switch label={key} checked={Boolean(value)} onCheckedChange={(checked) => setMenu({ ...menu, [key]: checked })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance Settings</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label="Primary color"><Input type="color" value={appearance.primaryColor} onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })} /></Field>
          <Field label="Secondary color"><Input type="color" value={appearance.secondaryColor} onChange={(e) => setAppearance({ ...appearance, secondaryColor: e.target.value })} /></Field>
          <Field label="Border radius"><Input type="number" value={appearance.borderRadius} onChange={(e) => setAppearance({ ...appearance, borderRadius: Number(e.target.value) })} /></Field>
          <Field label="Default theme">
            <Select value={appearance.defaultTheme} onChange={(e) => setAppearance({ ...appearance, defaultTheme: e.target.value as AppearanceSettings["defaultTheme"] })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
          <Field label="Card style">
            <Select value={appearance.cardStyle} onChange={(e) => setAppearance({ ...appearance, cardStyle: e.target.value as AppearanceSettings["cardStyle"] })}>
              <option value="flat">Flat</option>
              <option value="outlined">Outlined</option>
              <option value="elevated">Elevated</option>
            </Select>
          </Field>
          <Field label="Header layout">
            <Select value={appearance.headerLayout} onChange={(e) => setAppearance({ ...appearance, headerLayout: e.target.value as AppearanceSettings["headerLayout"] })}>
              <option value="compact">Compact</option>
              <option value="expanded">Expanded</option>
            </Select>
          </Field>
          <Field label="Menu layout">
            <Select value={appearance.menuLayout} onChange={(e) => setAppearance({ ...appearance, menuLayout: e.target.value as AppearanceSettings["menuLayout"] })}>
              <option value="list">List</option>
              <option value="grid">Grid</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>

      <Card>
        <CardHeader><CardTitle>Admin Password</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handlePasswordChange}>
            <Field label="Current password"><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></Field>
            <Field label="New password"><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></Field>
            <Field label="Confirm new password"><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></Field>
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit">Change password</Button>
              <Button type="button" variant="outline" onClick={sendReset}>Send forgot-password email</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function labelFromKey(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}
