import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Branded 1200×630 card shown when the menu link is shared (WhatsApp, Instagram,
// iMessage, Facebook, X): the real Stone Cafe logo on the brand-green background.
export const runtime = "nodejs";
export const alt = "Stone Cafe — Digital Menu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadLogo(): Promise<string | null> {
  try {
    const data = await readFile(join(process.cwd(), "public", "stone-cafe-logo.jpg"));
    return `data:image/jpeg;base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const logo = await loadLogo();
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1d5531 0%, #2e7d46 55%, #43a05f 100%)",
          color: "#f3faf4",
          fontFamily: "sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            borderRadius: 999,
            background: "#ffffff",
            overflow: "hidden",
            boxShadow: "0 24px 70px rgba(0,0,0,0.28)"
          }}
        >
          {logo ? (
            <img src={logo} width={360} height={360} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#1d5531", fontSize: 200, fontWeight: 800 }}>
              S
            </div>
          )}
        </div>
        <div style={{ fontSize: 34, marginTop: 44, opacity: 0.92, letterSpacing: 4, textTransform: "uppercase" }}>
          Scan · View the menu
        </div>
      </div>
    ),
    { ...size }
  );
}
