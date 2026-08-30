const association = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "86SK6M98QS.com.patitasinquietas.app",
        paths: ["/auth/confirm", "/auth/reset-password"],
      },
    ],
  },
};

export function GET() {
  return Response.json(association, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
