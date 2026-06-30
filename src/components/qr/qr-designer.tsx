"use client";

import QRCode from "qrcode";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, ExternalLink, FileText, LayoutGrid, Palette, Printer, QrCode, RotateCcw, Save, StickyNote, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAdminLocale } from "@/components/admin/admin-preferences";
import { getAdminAppData, saveSettings } from "@/lib/firebase/firestore";
import { hasSafeQrContrast } from "@/lib/utils/qr";
import { cn } from "@/lib/utils/cn";
import { defaultQrSettings } from "@/data/default-data";
import type { LocalizedText, QrSettings } from "@/types/models";

export type QrPrintDesign = "poster" | "card" | "tent";

export function QrDesigner({ printMode = false, printDesign = "poster" }: { printMode?: boolean; printDesign?: QrPrintDesign }) {
  const { text, dir: textDir } = useAdminLocale();
  const [settings, setSettings] = useState<QrSettings>(defaultQrSettings);
  const [dataUrl, setDataUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const menuUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/menu`;

  useEffect(() => {
    getAdminAppData().then((data) => {
      setSettings({ ...data.qr, menuUrl: data.qr.menuUrl || menuUrl });
    });
  }, [menuUrl]);

  useEffect(() => {
    let active = true;
    Promise.all([
      QRCode.toDataURL(settings.menuUrl, {
        errorCorrectionLevel: settings.includeLogo ? "H" : "Q",
        margin: 4,
        width: 640,
        color: { dark: settings.foregroundColor, light: settings.backgroundColor }
      }),
      QRCode.toString(settings.menuUrl, {
        type: "svg",
        errorCorrectionLevel: settings.includeLogo ? "H" : "Q",
        margin: 4,
        color: { dark: settings.foregroundColor, light: settings.backgroundColor }
      })
    ])
      .then(([nextDataUrl, nextSvg]) => {
        if (!active) return;
        setDataUrl(nextDataUrl);
        setSvg(nextSvg);
      })
      .catch(() => {
        if (!active) return;
        setDataUrl("");
        setSvg("");
        setError(text.qrGenerationFailed);
      });

    return () => {
      active = false;
    };
  }, [settings, text.qrGenerationFailed]);

  useEffect(() => {
    if (!printMode) return;
    document.body.classList.add("qr-printing");
    return () => document.body.classList.remove("qr-printing");
  }, [printMode]);

  async function saveQr() {
    setMessage("");
    setError("");
    if (!validMenuUrl) {
      setError(text.invalidUrl);
      return;
    }
    setSaving(true);
    try {
      await saveSettings("qr", settings as unknown as Record<string, unknown>);
      setMessage(text.qrSettingsSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.settingsSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function copyQr() {
    setMessage("");
    setError("");
    try {
      if ("ClipboardItem" in window && dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setMessage(text.qrImageCopied);
        return;
      }
      await navigator.clipboard.writeText(settings.menuUrl);
      setMessage(text.qrImageUnsupported);
    } catch {
      try {
        await navigator.clipboard.writeText(settings.menuUrl);
        setMessage(text.qrImageCopyFailed);
      } catch (err) {
        setError(err instanceof Error ? err.message : text.settingsSaveFailed);
      }
    }
  }

  async function copyUrl() {
    setMessage("");
    setError("");
    try {
      await navigator.clipboard.writeText(settings.menuUrl);
      setMessage(text.menuUrlCopied);
    } catch (err) {
      setError(err instanceof Error ? err.message : text.settingsSaveFailed);
    }
  }

  function downloadPng() {
    download(dataUrl, "stone-cafe-menu-qr.png");
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    download(URL.createObjectURL(blob), "stone-cafe-menu-qr.svg");
  }

  function reset() {
    setSettings({ ...defaultQrSettings, menuUrl });
    setMessage("");
    setError("");
  }

  const safeContrast = hasSafeQrContrast(settings.foregroundColor, settings.backgroundColor);
  const validMenuUrl = isValidUrl(settings.menuUrl);
  const readyToScan = validMenuUrl && safeContrast && Boolean(dataUrl);
  const logoSrc = settings.logoUrl || "/stone-cafe-logo.jpg";
  const displayUrl = settings.menuUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (printMode) {
    if (printDesign === "tent") {
      return (
        <main className="qr-print-area qr-tent-sheet">
          <div className="qr-tent">
            <div className="qr-tent-panel qr-tent-flip">
              <ScanCard logoSrc={logoSrc} qr={dataUrl} title={settings.title} url={displayUrl} size="tent" />
            </div>
            <div className="qr-tent-fold" aria-hidden />
            <div className="qr-tent-panel">
              <ScanCard logoSrc={logoSrc} qr={dataUrl} title={settings.title} url={displayUrl} size="tent" />
            </div>
          </div>
        </main>
      );
    }
    if (printDesign === "card") {
      return (
        <main className="qr-print-area qr-card-sheet">
          <div className="qr-card-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <ScanCard key={i} logoSrc={logoSrc} qr={dataUrl} title={settings.title} url={displayUrl} size="compact" />
            ))}
          </div>
        </main>
      );
    }
    return (
      <main className="qr-print-area qr-poster">
        <ScanCard logoSrc={logoSrc} qr={dataUrl} title={settings.title} url={displayUrl} size="poster" />
      </main>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{text.mainMenuQrCode}</h1>
          <p dir={textDir} className="text-muted-foreground">{text.qrDescription}</p>
        </div>
        <Badge className={readyToScan ? "border-primary/30 bg-primary/10 text-primary" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}>
          {readyToScan ? text.readyToScan : text.needsAttention}
        </Badge>
      </div>

      {message ? <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <QrHealthCard icon={validMenuUrl ? CheckCircle2 : AlertTriangle} label={text.menuUrl} value={validMenuUrl ? text.ready : text.invalidUrl} good={validMenuUrl} />
        <QrHealthCard icon={safeContrast ? CheckCircle2 : AlertTriangle} label={text.scanContrast} value={safeContrast ? text.goodContrast : text.needsAttention} good={safeContrast} />
        <QrHealthCard icon={settings.includeLogo ? CheckCircle2 : QrCode} label={text.logoProtection} value={settings.includeLogo ? text.enabled : text.disabled} good />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="settings-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" aria-hidden />
              {text.qrDesign}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <section className="space-y-3 rounded-lg border bg-muted/15 p-4">
              <h3 className="text-sm font-semibold">{text.destination}</h3>
              <Field label={text.menuUrl}>
                <Input value={settings.menuUrl} onChange={(e) => setSettings({ ...settings, menuUrl: e.target.value.trim() })} />
              </Field>
            </section>

            <section className="space-y-3 rounded-lg border bg-muted/15 p-4">
              <h3 className="text-sm font-semibold">{text.colors}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={text.foregroundColor}><Input type="color" value={settings.foregroundColor} onChange={(e) => setSettings({ ...settings, foregroundColor: e.target.value })} /></Field>
                <Field label={text.backgroundColor}><Input type="color" value={settings.backgroundColor} onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })} /></Field>
              </div>
              {!safeContrast ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{text.poorQrContrast}</p> : null}
              <div className="flex items-center justify-between rounded-md border bg-background p-3">
                <span className="text-sm font-medium">{text.includeLogo}</span>
                <Switch label={text.includeLogo} checked={settings.includeLogo} onCheckedChange={(checked) => setSettings({ ...settings, includeLogo: checked })} />
              </div>
            </section>

            <section className="space-y-3 rounded-lg border bg-muted/15 p-4">
              <h3 className="text-sm font-semibold">{text.printTitles}</h3>
              <div className="grid gap-4">
                <Field label={text.titleEnglish}><Input value={settings.title.en} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, en: e.target.value } })} /></Field>
                <Field label={text.titleArabic}><Input dir="rtl" value={settings.title.ar} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, ar: e.target.value } })} /></Field>
                <Field label={text.titleKurdish}><Input dir="rtl" value={settings.title.ckb} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, ckb: e.target.value } })} /></Field>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border bg-muted/15 p-4">
              <h3 className="text-sm font-semibold">{text.printableDesigns}</h3>
              <p dir={textDir} className="text-xs text-muted-foreground">{text.printableDesignsHint}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button asChild variant="outline">
                  <Link href="/admin/qr-code/print?design=poster" target="_blank"><FileText className="h-4 w-4" aria-hidden /> {text.designPoster}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/qr-code/print?design=tent" target="_blank"><StickyNote className="h-4 w-4" aria-hidden /> {text.designTent}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/qr-code/print?design=card" target="_blank"><LayoutGrid className="h-4 w-4" aria-hidden /> {text.designCardSheet}</Link>
                </Button>
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <Button onClick={saveQr} disabled={saving || !readyToScan}>
                <Save className="h-4 w-4" aria-hidden />
                {saving ? text.saving : text.save}
              </Button>
              <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden /> {text.reset}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" aria-hidden />
              {text.preview}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/25 p-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <div>
                  <h2 className="text-xl font-semibold">{settings.title.en}</h2>
                  <p dir="rtl" className="text-sm text-muted-foreground">{settings.title.ar}</p>
                  <p dir="rtl" className="text-sm text-muted-foreground">{settings.title.ckb}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {dataUrl ? <img src={dataUrl} alt={text.menuQrCode} className="h-72 w-72 rounded-md border bg-white p-3" /> : null}
                <p className="break-all text-sm text-muted-foreground">{settings.menuUrl}</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button onClick={copyUrl}><Copy className="h-4 w-4" aria-hidden /> {text.copyUrl}</Button>
                <Button variant="secondary" onClick={copyQr} disabled={!dataUrl}><Copy className="h-4 w-4" aria-hidden /> {text.copyQr}</Button>
                <Button variant="outline" onClick={downloadPng} disabled={!dataUrl}><Download className="h-4 w-4" aria-hidden /> PNG</Button>
                <Button variant="outline" onClick={downloadSvg} disabled={!svg}><Download className="h-4 w-4" aria-hidden /> SVG</Button>
                <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> {text.print}</Button>
                <Button asChild variant="outline">
                  <Link href="/admin/qr-code/print" target="_blank"><Printer className="h-4 w-4" aria-hidden /> {text.printPage}</Link>
                </Button>
                {validMenuUrl ? (
                  <Button asChild variant="outline" className="sm:col-span-2">
                    <Link href={settings.menuUrl} target="_blank"><ExternalLink className="h-4 w-4" aria-hidden /> {text.testLink}</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScanCard({
  logoSrc,
  qr,
  title,
  url,
  size
}: {
  logoSrc: string;
  qr: string;
  title: LocalizedText;
  url: string;
  size: "poster" | "tent" | "compact";
}) {
  return (
    <div className={cn("qr-card", size === "tent" && "qr-card-tent", size === "compact" && "qr-card-compact")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="qr-card-logo" src={logoSrc} alt="Stone Cafe" />
      <div className="qr-card-tile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr ? <img src={qr} alt="" /> : null}
      </div>
      <div className="qr-card-titles">
        <p className="qr-card-title" dir="rtl" lang="ckb">{title.ckb}</p>
        <p className="qr-card-title" dir="rtl" lang="ar">{title.ar}</p>
        <p className="qr-card-title qr-card-title-en">{title.en}</p>
      </div>
      <p className="qr-card-url">{url}</p>
    </div>
  );
}

function QrHealthCard({
  icon: Icon,
  label,
  value,
  good
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", good ? "border-primary/30 bg-primary/5" : "border-amber-500/30 bg-amber-500/5")}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", good ? "text-primary" : "text-amber-600 dark:text-amber-300")} aria-hidden />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function download(href: string, filename: string) {
  if (!href) return;
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}
