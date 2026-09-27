import { ImageResponse } from "next/og";

// The fill-line mark at home-screen size: a label with its fill line and the
// fill below it. Same drawing as icon.svg, rendered to PNG for iOS.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#15171a";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          background: "#ffffff",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `10px solid ${INK}`,
            borderRadius: 8,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div style={{ height: 14, background: INK, margin: "0 -10px" }} />
          <div style={{ height: 44, background: INK, margin: "6px 12px 12px" }} />
        </div>
      </div>
    ),
    size,
  );
}
