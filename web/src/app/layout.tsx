import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  title: "Ornalens — AI Jewellery Photography",
  description: "Studio-quality jewellery shoots in 15 minutes. Upload one photo, get a professional model shoot, 5 angle shots, and a cinematic video. Starting ₹1,299.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      dynamic
      appearance={{
        variables: {
          colorPrimary: "#9A6F0A",
          colorBackground: "#FAF7F2",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#1C1209",
          colorText: "#1C1209",
          colorTextSecondary: "#7A6550",
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
