import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import "./interior.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SearchDialog } from "@/components/search/search-dialog";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import Loading from "./loading";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </main>
        <SiteFooter />
        <SearchDialog />
      </body>
    </html>
  );
}
