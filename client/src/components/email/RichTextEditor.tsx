import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useTranslation } from 'react-i18next';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, 
  Link as LinkIcon, Image as ImageIcon, TypeIcon, RefreshCw, Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

function ColorSelector({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-1">
          <TypeIcon className="h-4 w-4" />
          <span>A</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-medium">{t('emailSignatures.textColor')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('emailSignatures.textColorDescription')}
          </p>
          <div className="grid grid-cols-10 gap-1 pt-2">
            {colors.map((color) => (
              <button
                key={color}
                className="h-5 w-5 rounded-sm border border-gray-200"
                style={{ backgroundColor: color }}
                onClick={() => {
                  editor?.chain().focus().setColor(color).run();
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LinkSelector({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('https://');

  const setLink = () => {
    if (!url) return;
    
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setUrl('https://');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <LinkIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">{t('emailSignatures.addLink')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('emailSignatures.addLinkDescription')}
          </p>
          <div className="flex gap-2">
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <Button onClick={setLink}>{t('emailSignatures.addLinkButton')}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ImageSelector({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const addImage = () => {
    if (!url) return;
    
    try {
      // Attempt to validate the URL
      new URL(url);
      
      editor?.chain().focus().setImage({ src: url }).run();
      setUrl('');
    } catch (e) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('common.validationError'),
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">{t('emailSignatures.addImage')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('emailSignatures.addImageDescription')}
          </p>
          <div className="flex gap-2">
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <Button onClick={addImage}>{t('emailSignatures.addImageButton')}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('editor');
  const [html, setHtml] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setHtml(html);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full rounded-md border border-input bg-transparent">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center p-1 border-b">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="editor">{t('emailSignatures.editorTab')}</TabsTrigger>
            <TabsTrigger value="preview">{t('emailSignatures.previewTab')}</TabsTrigger>
          </TabsList>

          {activeTab === 'editor' && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={editor?.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={editor?.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={editor?.isActive('underline') ? 'bg-accent text-accent-foreground' : ''}
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className={editor?.isActive({ textAlign: 'left' }) ? 'bg-accent text-accent-foreground' : ''}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className={editor?.isActive({ textAlign: 'center' }) ? 'bg-accent text-accent-foreground' : ''}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className={editor?.isActive({ textAlign: 'right' }) ? 'bg-accent text-accent-foreground' : ''}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <ColorSelector editor={editor} />
              <LinkSelector editor={editor} />
              <ImageSelector editor={editor} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {activeTab === 'preview' && (
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('editor')}>
              <Eye className="h-4 w-4 mr-2" />
              {t('emailSignatures.editButton')}
            </Button>
          )}
        </div>

        <TabsContent value="editor" className="p-0 border-0">
          <EditorContent editor={editor} className="p-3 min-h-[200px] prose prose-sm max-w-none focus-visible:outline-none" />
        </TabsContent>
        
        <TabsContent value="preview" className="p-3 border-0">
          <div className="mb-2 text-sm text-muted-foreground">
            {t('emailSignatures.previewDescription')}
          </div>
          <div className="p-4 border rounded-md min-h-[200px] bg-white">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}