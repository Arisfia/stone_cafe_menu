"use client";

import QRCode from "qrcode";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Download, Eye, EyeOff, ExternalLink, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getAdminAppData, saveSettings } from "@/lib/firebase/firestore";
import { hasSafeQrContrast } from "@/lib/utils/qr";
import { defaultQrSettings } from "@/data/default-data";
import type { QrSettings } from "@/types/models";

export function QrDesigner({ printMode = false }: { printMode?: boolean }) {
  const [settings, setSettings] = useState<QrSettings>(defaultQrSettings);
  const [dataUrl, setDataUrl] = useState("");
  const [svg, setSvg] = useState("");
  const [showPreview, setShowPreview] = useState(true);
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
    setMessage("QR settings saved.");
  }

  async function copyQr() {
    setMessage("");
    try {
      if ("ClipboardItem" in window && dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setMessage("QR image copied to clipboard.");
        return;
      }
      await navigator.clipboard.writeText(settings.menuUrl);
      setMessage("Image clipboard is unsupported, so the menu URL was copied.");
    } catch {
      await navigator.clipboard.writeText(settings.menuUrl);
      setMessage("QR image copy failed, so the menu URL was copied.");
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(settings.menuUrl);
    setMessage("Menu URL copied.");
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
        {dataUrl ? <img src={dataUrl} alt="Menu QR code" className="h-80 w-80" /> : null}
        <p className="break-all text-lg">{settings.menuUrl}</p>
      </main>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader><CardTitle>QR Design</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Menu URL">
            <Input value={settings.menuUrl} onChange={(e) => setSettings({ ...settings, menuUrl: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Foreground color"><Input type="color" value={settings.foregroundColor} onChange={(e) => setSettings({ ...settings, foregroundColor: e.target.value })} /></Field>
            <Field label="Background color"><Input type="color" value={settings.backgroundColor} onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })} /></Field>
          </div>
          {!safeContrast ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">Selected colors have poor contrast and may make the QR hard to scan.</p> : null}
          <div className="flex items-center justify-between rounded-md border p-3">
            <span className="text-sm font-medium">Include logo</span>
            <Switch label="Include logo" checked={settings.includeLogo} onCheckedChange={(checked) => setSettings({ ...settings, includeLogo: checked })} />
          </div>
          <div className="grid gap-4">
            <Field label="Title English"><Input value={settings.title.en} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, en: e.target.value } })} /></Field>
            <Field label="Title Arabic"><Input dir="rtl" value={settings.title.ar} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, ar: e.target.value } })} /></Field>
            <Field label="Title Kurdish"><Input dir="rtl" value={settings.title.ckb} onChange={(e) => setSettings({ ...settings, title: { ...settings.title, ckb: e.target.value } })} /></Field>
          </div>
          {message ? <p className="text-sm text-primary">{message}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveQr}>Save</Button>
            <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" aria-hidden /> Reset</Button>
            <Button variant="outline" onClick={() => setShowPreview((value) => !value)}>
              {showPreview ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {showPreview ? "Hide" : "Show"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold">Main Menu QR Code</h1>
          <p className="text-muted-foreground">One printable and copyable QR code for `/menu`. No table QR codes are generated.</p>
        </div>
        {showPreview ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-5 text-center">
              <h2 className="text-xl font-semibold">{settings.title.en}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {dataUrl ? <img src={dataUrl} alt="Menu QR code" className="h-72 w-72 rounded-md border bg-white p-3" /> : null}
              <p className="break-all text-sm text-muted-foreground">{settings.menuUrl}</p>
            </CardContent>
          </Card>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyUrl}><Copy className="h-4 w-4" aria-hidden /> Copy URL</Button>
          <Button variant="secondary" onClick={copyQr}><Copy className="h-4 w-4" aria-hidden /> Copy QR</Button>
          <Button variant="outline" onClick={downloadPng}><Download className="h-4 w-4" aria-hidden /> PNG</Button>
          <Button variant="outline" onClick={downloadSvg}><Download className="h-4 w-4" aria-hidden /> SVG</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Print</Button>
          <Button asChild variant="outline">
            <Link href="/admin/qr-code/print" target="_blank"><Printer className="h-4 w-4" aria-hidden /> Print page</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={settings.menuUrl} target="_blank"><ExternalLink className="h-4 w-4" aria-hidden /> Test link</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function download(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}
