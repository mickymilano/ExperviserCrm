import React from 'react';
import { type Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Unlink,
  Heading1,
  Heading2,
  PaintBucket,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
  editor: Editor | null;
}

export function RichTextEditor({ editor }: RichTextEditorProps) {
  const { t } = useTranslation();
  const [linkUrl, setLinkUrl] = React.useState<string>('https://');
  const [imageUrl, setImageUrl] = React.useState<string>('https://');
  const [imageAlt, setImageAlt] = React.useState<string>('');
  const [fontColor, setFontColor] = React.useState<string>('#000000');

  if (!editor) {
    return null;
  }

  const setLink = () => {
    // Check if URL is valid
    if (!/^https?:\/\/.+/.test(linkUrl)) {
      return;
    }

    // Check if text is selected
    if (editor.state.selection.empty) {
      // If no text is selected, insert link with URL as text
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${linkUrl}" target="_blank">${linkUrl}</a>`)
        .run();
    } else {
      // If text is selected, convert it to a link
      editor
        .chain()
        .focus()
        .setLink({ href: linkUrl, target: '_blank' })
        .run();
    }
  };

  const addImage = () => {
    // Check if URL is valid
    if (!/^https?:\/\/.+/.test(imageUrl)) {
      return;
    }

    editor
      .chain()
      .focus()
      .setImage({ 
        src: imageUrl,
        alt: imageAlt,
      })
      .run();
  };

  const fontFamilies = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
  ];

  return (
    <div className="border-b p-1 flex flex-wrap gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Underline"
      >
        <Underline className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />
      
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        aria-label="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-label="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />
      
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        aria-label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        aria-label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        aria-label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />
      
      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Toggle
            size="sm"
            pressed={editor.isActive('link')}
            aria-label="Add link"
          >
            <Link className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {t('emailSignatures.addLink')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('emailSignatures.addLinkDescription')}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="col-span-2"
                />
              </div>
            </div>
            <Button type="button" size="sm" onClick={setLink}>
              {t('emailSignatures.addLinkButton')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      
      {editor.isActive('link') && (
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().unsetLink().run()}
          aria-label="Remove link"
        >
          <Unlink className="h-4 w-4" />
        </Toggle>
      )}

      <div className="w-px h-6 bg-border mx-1" />
      
      <Popover>
        <PopoverTrigger asChild>
          <Toggle size="sm" aria-label="Add image">
            <Image className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {t('emailSignatures.addImage')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('emailSignatures.addImageDescription')}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="image-url">URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="col-span-2"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="col-span-2"
                />
              </div>
            </div>
            <Button type="button" size="sm" onClick={addImage}>
              {t('emailSignatures.addImageButton')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border mx-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Toggle size="sm" aria-label="Text color">
            <PaintBucket className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">
                {t('emailSignatures.textColor')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('emailSignatures.textColorDescription')}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="font-color">Color</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <Input
                    id="font-color"
                    type="color"
                    value={fontColor}
                    onChange={(e) => {
                      setFontColor(e.target.value);
                      editor.chain().focus().setColor(e.target.value).run();
                    }}
                    className="w-12 h-8 p-0"
                  />
                  <div 
                    className="w-6 h-6 rounded-sm border" 
                    style={{ backgroundColor: fontColor }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080'].map((color) => (
                <Button
                  key={color}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setFontColor(color);
                    editor.chain().focus().setColor(color).run();
                  }}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-border mx-1" />

      <Select
        onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue placeholder="Font family" />
        </SelectTrigger>
        <SelectContent>
          {fontFamilies.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              <span style={{ fontFamily: font.value }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}