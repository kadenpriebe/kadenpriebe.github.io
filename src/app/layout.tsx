import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { siteMetadata } from "@/lib/metadata";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { EasterEggs } from "@/components/interactive/easter-eggs";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${geistSans.variable} antialiased`}>
      <body className="flex min-h-screen flex-col bg-brand-bg text-brand-text font-sans selection:bg-brand-text selection:text-brand-bg">
        <EasterEggs />
        <Nav />
        <div className="flex-grow flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full border-x border-black/5">
          <main className="flex-grow min-w-0 overflow-x-hidden">
            {children}
          </main>
          <Sidebar />
        </div>
        <Footer />
      </body>
    </html>
  );
}
