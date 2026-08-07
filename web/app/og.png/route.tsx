import { ImageResponse } from "next/og";

/**
 * Imaginea de share (Open Graph) a platformei: logo-ul Siteora, generat la
 * cerere ca PNG 1200×630.
 *
 * E o rută explicită, nu convenția de fișier `opengraph-image`, pentru că
 * aceasta din urmă s-ar propaga și la `/[tenant]` — iar pe un domeniu custom
 * middleware-ul rescrie orice cale spre `/{slug}/…`, deci URL-ul imaginii ar da
 * 404. Aici URL-ul e absolut pe `metadataBase` (siteora.ro) și se termină în
 * `.png`, extensie pe care matcher-ul middleware-ului o ignoră.
 */

export const runtime = "nodejs";

const PRIMARY = "#183c32";
const CREAM = "#f5efe3";
const GOLD = "#c99a45";

/** Sparkles (lucide) — aceeași iconiță ca marca din header-ul site-ului. */
const SPARKLES = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${PRIMARY}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M6 18H4"/></svg>`;

const SPARKLES_URI = `data:image/svg+xml;utf8,${encodeURIComponent(SPARKLES)}`;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PRIMARY,
          color: CREAM,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 140,
              height: 140,
              marginRight: 32,
              borderRadius: 36,
              backgroundColor: CREAM,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SPARKLES_URI} width={78} height={78} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 132, letterSpacing: -4 }}>
            Siteora
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            maxWidth: 900,
            fontSize: 34,
            lineHeight: 1.35,
            textAlign: "center",
            color: "#e2d7c2",
          }}
        >
          Construiește digital orice destinație, eveniment sau instituție
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 14,
            backgroundColor: GOLD,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
