import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PwaManager } from "@/components/pwa/pwa-manager";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F766E"
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sobaya.ci"),
  title: "SOBAYA — Gestion Immobilière",
  description: "Votre patrimoine immobilier sous contrôle. Gérez vos biens, locataires, contrats et paiements.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOBAYA"
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "SOBAYA",
    title: "SOBAYA — Gestion Immobilière",
    description: "Votre patrimoine immobilier sous contrôle.",
    images: [{ url: "/branding/logo-sobaya.png" }]
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/branding/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <PwaManager />
      </body>
    </html>
  );
}
