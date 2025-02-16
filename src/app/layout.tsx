"use client";

import { usePathname } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import IconSideNav from "@/components/shared/Header";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current route

  // Hide footer for all pages inside `/subject/*`
  const isSubjectPage = pathname.startsWith("/subject");

  return (
    <html lang="en">
      <body className={`${inter.className} flex`}>
        {/* Sidebar Navigation */}
        <IconSideNav />

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-screen ml-20">
          {/* Header (Top Navigation) */}
          <Header />

          {/* Main Content */}
          <main className="flex-1 p-6">{children}</main>

          {/* Conditionally Show Footer */}
          {!isSubjectPage && <Footer />}
        </div>
      </body>
    </html>
  );
}
