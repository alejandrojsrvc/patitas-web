import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Patitas Inquietas: que nunca le falte lo que necesita tu mascota";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [logo, isotype, bricolage, snPro] = await Promise.all([
    readFile(path.join(process.cwd(), "public/brand/patitas-logo-horizontal.png")),
    readFile(path.join(process.cwd(), "public/brand/patitas-isotipo.png")),
    readFile(
      path.join(
        process.cwd(),
        "public/fonts/bricolage-grotesque/bricolage-grotesque-semibold.ttf",
      ),
    ),
    readFile(
      path.join(process.cwd(), "public/fonts/sn-pro/sn-pro-regular.ttf"),
    ),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const isotypeSrc = `data:image/png;base64,${isotype.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#FFFDF5",
        color: "#171717",
        padding: "72px 80px",
        fontFamily: "SN Pro",
      }}
    >
      <img
        src={logoSrc}
        alt=""
        width={390}
        height={43}
        style={{ objectFit: "contain" }}
      />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 810 }}>
          <div
            style={{
              fontFamily: "Bricolage",
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
            }}
          >
            Que nunca le falte lo que necesita.
          </div>
          <div style={{ marginTop: 28, fontSize: 29, color: "#686868" }}>
            Alimento y esenciales, organizados según el ritmo de tu mascota.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 170,
            height: 170,
            borderRadius: 38,
            background: "#FFEC00",
            boxShadow: "0 18px 40px rgba(0, 85, 255, 0.18)",
          }}
        >
          <img
            src={isotypeSrc}
            alt=""
            width={102}
            height={122}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
      <div style={{ display: "flex", width: 118, height: 15, background: "#FFEC00" }} />
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Bricolage",
          data: bricolage.buffer.slice(
            bricolage.byteOffset,
            bricolage.byteOffset + bricolage.byteLength,
          ) as ArrayBuffer,
          weight: 600,
        },
        {
          name: "SN Pro",
          data: snPro.buffer.slice(
            snPro.byteOffset,
            snPro.byteOffset + snPro.byteLength,
          ) as ArrayBuffer,
          weight: 400,
        },
      ],
    },
  );
}
