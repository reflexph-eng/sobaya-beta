"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo
} from "lucide-react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function RichEditor({ content, onChange, disabled = false }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] })
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded p-1.5 transition ${active
      ? "bg-sobaya-primary text-white"
      : "text-sobaya-muted hover:bg-sobaya-soft hover:text-sobaya-ink"}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-sobaya-border bg-white">
      {/* Barre d'outils */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-1 border-b border-sobaya-border bg-sobaya-soft px-3 py-2">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Gras"><Bold size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italique"><Italic size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Souligné"><UnderlineIcon size={15} /></button>
          <div className="mx-1 h-5 w-px bg-sobaya-border" />
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="Titre 2"><Heading2 size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="Titre 3"><Heading3 size={15} /></button>
          <div className="mx-1 h-5 w-px bg-sobaya-border" />
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Liste"><List size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Liste numérotée"><ListOrdered size={15} /></button>
          <div className="mx-1 h-5 w-px bg-sobaya-border" />
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))} title="Gauche"><AlignLeft size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))} title="Centre"><AlignCenter size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btn(editor.isActive({ textAlign: "right" }))} title="Droite"><AlignRight size={15} /></button>
          <div className="mx-1 h-5 w-px bg-sobaya-border" />
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false)} title="Annuler"><Undo size={15} /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false)} title="Rétablir"><Redo size={15} /></button>
        </div>
      )}

      {/* Zone d'édition */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-5 py-4 focus:outline-none min-h-[400px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px]"
      />
    </div>
  );
}
