import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Patitas Inquietas: un perro y un gato asomándose juntos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [logo, hero, snPro, snProSemibold] = await Promise.all([
    readFile(path.join(process.cwd(), "public/brand/patitas-logo-horizontal.png")),
    readFile(path.join(process.cwd(), "public/brand/landing/hero-pets-playful-v1.png")),
    readFile(
      path.join(process.cwd(), "public/fonts/sn-pro/sn-pro-regular.ttf"),
    ),
    readFile(
      path.join(process.cwd(), "public/fonts/sn-pro/sn-pro-semibold.ttf"),
    ),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const heroSrc = `data:image/png;base64,${hero.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#F7F0EA",
        color: "#171717",
        fontFamily: "SN Pro",
      }}
    >
      <img
        src={heroSrc}
        alt=""
        width={1200}
        height={630}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "right center" }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          width: 650,
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 0 64px 72px",
        }}
      >
      <img
        src={logoSrc}
        alt=""
        width={300}
        height={33}
        style={{ objectFit: "contain" }}
      />
        <div style={{ display: "flex", flexDirection: "column", width: 590 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
            }}
          >
            Que no te falte lo de siempre.
          </div>
          <div style={{ marginTop: 24, fontSize: 26, color: "#686868", lineHeight: 1.25 }}>
            Tu pet shop online en CABA para perros y gatos.
          </div>
        </div>
        <div style={{ display: "flex", width: 118, height: 15, background: "#FFEC00" }} />
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "SN Pro",
          data: snPro.buffer.slice(
            snPro.byteOffset,
            snPro.byteOffset + snPro.byteLength,
          ) as ArrayBuffer,
          weight: 400,
        },
        {
          name: "SN Pro",
          data: snProSemibold.buffer.slice(
            snProSemibold.byteOffset,
            snProSemibold.byteOffset + snProSemibold.byteLength,
          ) as ArrayBuffer,
          weight: 600,
        },
      ],
    },
  );
}
