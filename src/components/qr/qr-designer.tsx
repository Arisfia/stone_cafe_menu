"use client";

import QRCode from "qrcode";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Download, ExternalLink, Printer, QrCode, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAdminLocale } from "@/components/admin/admin-preferences";
import { getAdminAppData, saveSettings } from "@/lib/firebase/firestore";
import { hasSafeQrContrast } from "@/lib/utils/qr";
import { defaultQrSettings } from "@/data/default-data";
import type { QrSettings } from "@/types/models";

export function QrDesigner({ printMode = false }: { printMode?: boolean }) {
  const { text } = useAdminLocale();
  const [settings, setSettings] = useState<QrSettings>(defaultQrSettings);
  const [dataUrl, setDataUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [designOpen, setDesignOpen] = useState(false);
  const [message, setMessage] = useState("");
  const menuUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/menu`;

  useEffect(() => {
    getAdminAppData().then((data) => {
      setSettings({ ...data.qr, menuUrl: data.qr.menuUrl || menuUrl });
    });
  }, [menuUrl]);

  useEffect(() => {
    QRCode.toDataURL(settings.menuUrl, {
      errorCorrectionLevel: settings.includeLogo ? "H" : "Q",
      margin: 4,
      width: 640,
      color: { dark: settings.foregroundColor, light: settings.backgroundColor }
    }).then(setDataUrl);
    QRCode.toString(settings.menuUrl, {
      type: "svg",
      errorCorrectionLevel: settings.includeLogo ? "H" : "Q",
      margin: 4,
      color: { dark: settings.foregroundColor, light: settings.backgroundColor }
    }).then(setSvg);
  }, [settings]);

  async function saveQr() {
    await saveSettings("qr", settings as unknown as Record<string, unknown>);
    setMessage(text.qrSettingsSaved);
  }

  async function copyQr() {
    setMessage("");
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
      await navigator.clipboard.writeText(settings.menuUrl);
      setMessage(text.qrImageCopyFailed);
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(settings.menuUrl);
    setMessage(text.menuUrlCopied);
  }

  function downloadPng() {
    download(dataUrl, "ary-menu-qr.png");
  }

  function downloadSvg() {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    download(URL.createObjectURL(blob), "ary-menu-qr.svg");
  }

  function reset() {
    setSettings({ ...defaultQrSettings, menuUrl });
  }

  const safeContrast = hasSafeQrContrast(settings.foregroundColor, settings.backgroundColor);

  if (printMode) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 bg-white p-8 text-center text-black">
        <div className="text-2xl font-semibold">{settings.title.en}</div>
        <div className="text-xl" dir="rtl">{settings.title.ar}</div>
        <div className="text-xl" dir="rtl">{settings.title.ckb}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {dataUrl ? <img src={dataUrl} alt={text.menuQrCode} className="h-80 w-80" /> : null}
        <p className="break-all text-lg">{settings.menuUrl}</p>
      </main>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{text.mainMenuQrCode}</h1>
        <p className="text-muted-foreground">{text.qrDescription}</p>
      </div>

      <Button
        type="button"
        variant={designOpen ? "default" : "outline"}
        aria-expanded={designOpen}
        onClick={() => setDesignOpen((value) => !value)}
        className="h-auto min-h-16 justify-start rounded-lg p-4 text-start transition-all duration-200"
      >
        <QrCode className="h-5 w-5 shrink-0" aria-hidden />
        <span>{text.qrDesign}</span>
      </Button>

      {designOpen ? (
        <Card className="settings-panel">
          <CardHeader><CardTitle>{text.qrDesign}</CardTitle></CardHeader>
          <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Field label={text.menuUrl}>
                <Input value={settings.menuUrl} onChange={(e) => setSettings({ ...settings, menuUrl: e.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={text.foregroundColor}><Input type="color" value={settings.foregroundColor} onChange={(e) => setSettings({ ...settings, foregroundColor: e.target.value })} /></Field>
                <Field label={text.backgroundColor}><Input type="color" value={settings.backgroundColor} onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })} /></Field>
              </div>
              {!safeContrast ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{text.poorQrContrast}</p> : null}
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-medium">{text.includeLogo}</span>
                <Switch label={text.includeLogo} checked={settings.includeLogo} onCheckedChange={(checked) => setSettings({ ...settings, includeLogo: checked })} />
              </div>
              <div className="grid gap-4">
                <Field label={text.titleEnglish}><Input value={settings.title.en} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, en: e.target.value } })} /></Field>
                <Field label={text.titleArabic}><Input dir="rtl" value={settings.title.ar} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, ar: e.target.value } })} /></Field>
                <Field label={text.titleKurdish}><Input dir="rtl" value={settings.title.ckb} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, ckb: e.target.value } })} /></Field>
              </div>
              {message ? <p className="text-sm text-primary">{message}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveQr}>{text.save}</Button>
                <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden /> {text.reset}</Button>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/25 p-4">
              <div className="flex flex-col items-center gap-4 text-center">
                <h2 className="text-xl font-semibold">{settings.title.en}</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {dataUrl ? <img src={dataUrl} alt={text.menuQrCode} className="h-72 w-72 rounded-md border bg-white p-3" /> : null}
                <p className="break-all text-sm text-muted-foreground">{settings.menuUrl}</p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button onClick={copyUrl}><Copy className="h-4 w-4" aria-hidden /> {text.copyUrl}</Button>
                <Button variant="secondary" onClick={copyQr}><Copy className="h-4 w-4" aria-hidden /> {text.copyQr}</Button>
                <Button variant="outline" onClick={downloadPng}><Download className="h-4 w-4" aria-hidden /> PNG</Button>
                <Button variant="outline" onClick={downloadSvg}><Download className="h-4 w-4" aria-hidden /> SVG</Button>
                <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> {text.print}</Button>
                <Button asChild variant="outline">
                  <Link href="/admin/qr-code/print" target="_blank"><Printer className="h-4 w-4" aria-hidden /> {text.printPage}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={settings.menuUrl} target="_blank"><ExternalLink className="h-4 w-4" aria-hidden /> {text.testLink}</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function download(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}
