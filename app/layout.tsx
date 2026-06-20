import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export const metadata: Metadata = {
  title: "SOBAYA",
  description: "Votre patrimoine. Sous contrôle.",
  icons: {
    icon: "/branding/favicon.ico",
    shortcut: "/branding/favicon.ico",
    apple: "/branding/icon-sobaya.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
