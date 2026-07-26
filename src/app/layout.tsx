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
  title: "CreateDNA — Stay on brand, on every AI",
  description:
    "AI blurs everyone into the same look. CreateDNA reads your visual identity from your real work and turns it into a portable palette and system prompt — so every AI tool, from Midjourney to ChatGPT, stays on brand. Built with IBM Granite on watsonx.ai.",
  keywords: [
    "brand consistency",
    "AI brand guardrail",
    "creative identity",
    "IBM Granite",
    "watsonx",
    "creative DNA",
    "AI Builders Challenge",
  ],
  openGraph: {
    title: "CreateDNA — Stay on brand, on every AI",
    description:
      "Turn your visual identity into a portable palette and system prompt that keeps every AI tool on brand.",
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
