import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const addImage = useCallback(() => {
    const url = window.prompt('URL dell\'immagine');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  }, [editor]);

  const buttonClass = 'p-2 rounded-md text-sm';
  const activeButtonClass = 'bg-primary/10 text-primary';

  return (
    <div className="border-b p-1 flex flex-wrap gap-1 items-center overflow-x-auto">
      {/* Text formatting */}
      <Toggle
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('bold') && activeButtonClass)}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('italic') && activeButtonClass)}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('strike') && activeButtonClass)}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      
      <div className="h-6 w-px bg-border mx-1" />
      
      {/* Text alignment */}
      <Toggle
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive({ textAlign: 'left' }) && activeButtonClass)}
        aria-label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive({ textAlign: 'center' }) && activeButtonClass)}
        aria-label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive({ textAlign: 'right' }) && activeButtonClass)}
        aria-label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive({ textAlign: 'justify' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive({ textAlign: 'justify' }) && activeButtonClass)}
        aria-label="Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>
      
      <div className="h-6 w-px bg-border mx-1" />
      
      {/* Lists */}
      <Toggle
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('bulletList') && activeButtonClass)}
        aria-label="Bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('orderedList') && activeButtonClass)}
        aria-label="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('blockquote') && activeButtonClass)}
        aria-label="Block quote"
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      
      <div className="h-6 w-px bg-border mx-1" />
      
      {/* Links and images */}
      <Toggle
        pressed={editor.isActive('link')}
        onPressedChange={setLink}
        size="sm"
        variant="outline"
        className={cn(buttonClass, editor.isActive('link') && activeButtonClass)}
        aria-label="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        onPressedChange={addImage}
        size="sm"
        variant="outline"
        className={buttonClass}
        aria-label="Image"
      >
        <ImageIcon className="h-4 w-4" />
      </Toggle>
      
      <div className="h-6 w-px bg-border mx-1" />
      
      {/* Undo/redo */}
      <Toggle
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        size="sm"
        variant="outline"
        className={buttonClass}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        size="sm"
        variant="outline"
        className={buttonClass}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

interface TiptapProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export const Tiptap = ({
  value,
  onChange,
  editable = true,
  placeholder = 'Scrivi qui...',
}: TiptapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Avoid updating the editor content if it's already the same
      // This prevents cursor position from jumping
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className="tiptap-editor">
      {editable && <MenuBar editor={editor} />}
      <EditorContent 
        editor={editor} 
        className="p-3 min-h-[200px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none focus:outline-none" 
      />
    </div>
  );
};