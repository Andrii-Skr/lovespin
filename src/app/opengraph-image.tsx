import { ImageResponse } from "next/og";

export const alt = "LoveSpin — романтическая история";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "radial-gradient(circle at 50% 0%, #5b2134, #1b0b11 65%)",
        color: "#f7eadd",
      }}
    >
      <div style={{ fontSize: 44, color: "#bd4f6c", marginBottom: 24 }}>♥</div>
      <div style={{ fontFamily: "serif", fontSize: 112, letterSpacing: -5 }}>LoveSpin</div>
      <div style={{ marginTop: 22, fontSize: 25, letterSpacing: 7, color: "#d0b7b0", textTransform: "uppercase" }}>Три счастливых вращения</div>
    </div>,
    size,
  );
}
