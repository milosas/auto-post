import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Post Generator",
  description: "Generate professional social media posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
