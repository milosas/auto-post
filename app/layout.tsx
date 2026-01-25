import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

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
    <html lang="lt">
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 2000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
