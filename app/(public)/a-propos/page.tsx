import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { AboutPage } from "@/components/about/about-page";

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <AboutPage />
      <LegalFooter />
    </main>
  );
}
