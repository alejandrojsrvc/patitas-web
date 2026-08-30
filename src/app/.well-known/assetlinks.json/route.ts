const ANDROID_PACKAGE_NAME = "com.patitasinquietas.app";

function certificateFingerprints() {
  return (process.env.ANDROID_APP_CERTIFICATE_SHA256 ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean);
}

export function GET() {
  const fingerprints = certificateFingerprints();
  const associations = fingerprints.length > 0
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: ANDROID_PACKAGE_NAME,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];

  return Response.json(associations, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
