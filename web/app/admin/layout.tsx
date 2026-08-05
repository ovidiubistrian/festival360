"use client";

import * as React from "react";
import { isLoggedIn, refresh } from "@/lib/admin/store";

/**
 * Client layout for the demo admin. On mount it loads real data from the API
 * into the module store when a session token is present. It only triggers the
 * module `refresh()` (an external-store update) — never a React setState in the
 * effect — so the login page child still renders unchanged.
 */
export default function DemoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (isLoggedIn()) {
      void refresh();
    }
  }, []);

  return <>{children}</>;
}
