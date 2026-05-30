import { ImageResponse } from "next/og";

export const alt = "Flappy Bird com Gestos por Matheus Siqueira";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f8f7",
          color: "#111417",
          padding: 64,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 26,
            width: "62%",
          }}
        >
          <div style={{ fontSize: 28, color: "#2f8f68", fontWeight: 700 }}>
            Portfolio Project
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 0.95 }}>
            Flappy Bird com Gestos
          </div>
          <div style={{ fontSize: 30, color: "#3a4148" }}>
            Next.js, PWA, dashboard inteligente e engine original em Python.
          </div>
          <div style={{ fontSize: 24, color: "#58616b" }}>
            Desenvolvido por Matheus Siqueira
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "38%",
          }}
        >
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: 160,
              background: "#f5b63f",
              border: "12px solid #111417",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 128,
              fontWeight: 900,
            }}
          >
            FB
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
