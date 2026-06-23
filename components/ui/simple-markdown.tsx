/**
 * Rendu minimal volontaire : pas de dépendance externe pour un besoin aussi
 * simple (titres, paragraphes, gras). Supporte uniquement la syntaxe utilisée
 * dans constants/legal-documents.ts : "# ", "## ", "**texte**", lignes vides.
 * Si les textes légaux finaux nécessitent plus (listes, liens), remplacer ce
 * composant par une vraie librairie markdown à ce moment-là.
 */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let paragraphBuffer: string[] = [];

  function flushParagraph(key: string) {
    if (paragraphBuffer.length === 0) return;
    blocks.push(
      <p key={key} className="mb-4 leading-7 text-sobaya-ink">
        {renderInline(paragraphBuffer.join(" "))}
      </p>
    );
    paragraphBuffer = [];
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushParagraph(`p-${index}`);
      blocks.push(<h2 key={index} className="mb-3 mt-6 text-lg font-semibold text-sobaya-ink">{trimmed.slice(3)}</h2>);
    } else if (trimmed.startsWith("# ")) {
      flushParagraph(`p-${index}`);
      blocks.push(<h1 key={index} className="mb-4 text-2xl font-bold text-sobaya-ink">{trimmed.slice(2)}</h1>);
    } else if (trimmed === "") {
      flushParagraph(`p-${index}`);
    } else {
      paragraphBuffer.push(trimmed);
    }
  });
  flushParagraph("p-end");

  return <div>{blocks}</div>;
}
