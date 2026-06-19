import Navigation from "@/components/Navigation";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      <main className="page-wrapper animate-fade-in">
        <div className="container">
          {children}
        </div>
      </main>
    </>
  );
}
