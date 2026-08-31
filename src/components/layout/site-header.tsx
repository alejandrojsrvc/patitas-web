import { Suspense } from "react";

import type { StorefrontShell } from "@/domain/storefront/types";
import { emptyStorefrontShell } from "@/domain/storefront/types";
import { SessionRefreshBoundary } from "@/features/auth/session-refresh-boundary";
import { CartHydrator } from "@/features/cart/cart-context";
import { getStorefrontBootstrap } from "@/infrastructure/api/commerce-server";
import { SiteHeaderClient } from "./site-header-client";

type SiteHeaderProps = {
  searchQuery?: string;
  minimal?: boolean;
  initialShell?: StorefrontShell;
};

export function SiteHeader(props: SiteHeaderProps) {
  if (props.initialShell) return <ResolvedSiteHeader {...props} shell={props.initialShell} hydrateCart={false} />;

  return (
    <Suspense fallback={<SiteHeaderClient shell={emptyStorefrontShell} searchQuery={props.searchQuery} minimal={props.minimal} />}>
      <StorefrontBootstrap {...props} />
    </Suspense>
  );
}

async function StorefrontBootstrap(props: SiteHeaderProps) {
  const result = await getStorefrontBootstrap();
  return (
    <>
      <SessionRefreshBoundary required={result.refreshRequired} />
      <ResolvedSiteHeader {...props} shell={result.data ?? emptyStorefrontShell} hydrateCart />
    </>
  );
}

function ResolvedSiteHeader({ shell, searchQuery, minimal, hydrateCart }: SiteHeaderProps & { shell: StorefrontShell; hydrateCart: boolean }) {
  return (
    <>
      {hydrateCart ? <CartHydrator cart={shell.cart} /> : null}
      <SiteHeaderClient shell={shell} searchQuery={searchQuery} minimal={minimal} />
    </>
  );
}
