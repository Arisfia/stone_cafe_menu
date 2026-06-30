import { ImageResponse } from "next/og";

// Branded 1200×630 card shown when the menu link is shared (WhatsApp, Instagram,
// iMessage, Facebook, X). Pure text/shapes — no external image or font loading —
// so it renders reliably on the edge runtime.
export const runtime = "edge";
export const alt = "Stone Cafe — Digital Menu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
            width: 168,
            height: 168,
            borderRadius: 999,
            background: "#f3faf4",
            color: "#1d5531",
            fontSize: 104,
            fontWeight: 800,
            marginBottom: 40
          }}
        >
          S
        </div>
        <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3 }}>Stone Cafe</div>
        <div style={{ fontSize: 38, marginTop: 16, opacity: 0.9 }}>Fresh coffee · warm meals · desserts</div>
        <div style={{ fontSize: 26, marginTop: 48, opacity: 0.72, letterSpacing: 6, textTransform: "uppercase" }}>
          Scan · View the menu
        </div>
      </div>
    ),
    { ...size }
  );
}
