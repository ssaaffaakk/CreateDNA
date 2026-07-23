import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CreateDNA — AI That Knows Your Style",
  description:
    "Upload your portfolio. AI learns your creative identity — palette, style, mood, techniques — and generates project kits that sound like you. Built with IBM Granite on watsonx.ai.",
  keywords: [
    "creative AI",
    "style analysis",
    "IBM Granite",
    "portfolio",
    "creative DNA",
    "AI Builders Challenge",
  ],
  openGraph: {
    title: "CreateDNA — AI That Knows Your Style",
    description:
      "Upload your portfolio. AI extracts your creative DNA and generates project kits in your style.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
