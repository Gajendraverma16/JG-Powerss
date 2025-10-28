// src/components/SimpleEditor.jsx
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';

function MenuBar({ editor }) {
  if (!editor) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 border rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
      >
        B
      </button>
      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 border rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
      >
        I
      </button>
      {/* Heading */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 border rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
      >
        H2
      </button>
      {/* Bullet List */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 border rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
      >
        • List
      </button>
      {/* Link */}
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter URL');
          if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }
        }}
        className={`px-2 py-1 border rounded ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
      >
        Link
      </button>
      {/* Clear formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="px-2 py-1 border rounded"
      >
        Clear
      </button>
    </div>
  );
}

export default function SimpleEditor({ initialContent = '', onUpdate }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start typing...' }),
      Link.configure({ openOnClick: true }),
      CharacterCount.configure({ limit: 1000 }), // optional: adjust limit or remove
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      if (onUpdate) {
        onUpdate({ html, json });
      }
    },
  });

  // Clean up editor on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  return (
    <div className="border rounded-md">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="ProseMirror p-4 min-h-[200px]" />
      {/* Optional: character count display */}
      {editor && (
        <div className="text-sm text-gray-500 mt-1 text-right">
          {editor.storage.characterCount.characters()} / 1000
        </div>
      )}
    </div>
  );
}
