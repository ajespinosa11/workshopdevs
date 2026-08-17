'use client'

import Navigation from "@/components/Navigation";
import { usePathname } from "next/navigation";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isBookSession = pathname === "/book-session";
  const isHome = pathname === "/";

  return (
    <>
      <Navigation />
      <main
        className="page-wrapper animate-fade-in"
        style={isHome ? { padding: 0 } : undefined}
      >
        {isHome ? (
          // Homepage: full-bleed, no container wrapper
          <>{children}</>
        ) : isBookSession ? (
          // Book session: wide container with side padding
          <div className="container-fluid">{children}</div>
        ) : (
          // All other pages: standard centered container
          <div className="container">{children}</div>
        )}
      </main>
    </>
  );
}
