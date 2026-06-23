import Link from "next/link";

const links = [
  { href: "/legal/cgu", label: "CGU" },
  { href: "/legal/cgs", label: "CGS" },
  { href: "/legal/confidentialite", label: "Confidentialité" },
  { href: "/legal/verification", label: "Politique de vérification" },
  { href: "/legal/mentions-legales", label: "Mentions légales" }
];

export function LegalFooter() {
  return (
    <footer className="mx-auto mt-12 w-full max-w-6xl border-t border-sobaya-border px-5 py-6">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-sobaya-muted">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-sobaya-ink hover:underline">
            {link.label}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-sobaya-muted">© {new Date().getFullYear()} Cabinet Grain de Sel — SOBAYA</p>
    </footer>
  );
}
