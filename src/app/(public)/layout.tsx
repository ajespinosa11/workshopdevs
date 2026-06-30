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
        style={isHome ? { paddingTop: 0 } : undefined}
      >
        <div className={isBookSession || isHome ? "container-fluid" : "container"}>
          {children}
        </div>
      </main>
    </>
  );
}
