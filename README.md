This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Universal Links and App Links

The storefront serves the association documents at:

- `/.well-known/apple-app-site-association`
- `/.well-known/assetlinks.json`

It also provides web fallbacks for `/auth/confirm` and `/auth/reset-password`, preserving the email token when opening the `patitas://` scheme.

Set `ANDROID_APP_CERTIFICATE_SHA256` in the deployed environment to the SHA-256 fingerprint of the Android distribution certificate. Multiple fingerprints can be comma-separated. When the variable is empty, `assetlinks.json` returns an empty list and Android does not claim the domain.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Old Prince catalog scraper

The offline scraper reads the dog category and then each product detail from Old Prince. It writes a JSON snapshot with the product name, inferred catalog attributes, ingredients, presentations, feeding table, guaranteed analysis and image URLs:

```bash
pnpm scrape:old-prince -- --output /tmp/old-prince-catalog.json
```

The source site does not publish SKU or prices, so the snapshot does not invent those commercial fields. Use `--limit 2` for a small verification run and `--delay-ms 500` to keep a pause between detail requests.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
