import { useState, useEffect, forwardRef } from 'react';
import { useEditor, EditorContent, Editor, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Code,
  List,
  ListOrdered,
  Palette
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

type ColorOption = {
  value: string;
  label: string;
};

type FontOption = {
  value: string;
  label: string;
};

const colors: ColorOption[] = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#FF0000', label: 'Red' },
  { value: '#00FF00', label: 'Green' },
  { value: '#0000FF', label: 'Blue' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#FF00FF', label: 'Magenta' },
  { value: '#00FFFF', label: 'Cyan' },
  { value: '#C0C0C0', label: 'Silver' },
  { value: '#808080', label: 'Gray' },
  { value: '#800000', label: 'Maroon' },
  { value: '#808000', label: 'Olive' },
  { value: '#008000', label: 'Green' },
  { value: '#800080', label: 'Purple' },
  { value: '#008080', label: 'Teal' },
  { value: '#000080', label: 'Navy' },
];

const fonts: FontOption[] = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
];

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ content, onChange, className, placeholder }, ref) => {
    const [linkUrl, setLinkUrl] = useState('');
    const [linkMenuOpen, setLinkMenuOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [imageMenuOpen, setImageMenuOpen] = useState(false);
    const [currentTextAlign, setCurrentTextAlign] = useState<string>('left');
    const [selectedColor, setSelectedColor] = useState<string>('#000000');
    const [selectedFont, setSelectedFont] = useState<string>('Arial');
    const [colorMenuOpen, setColorMenuOpen] = useState(false);
    const [fontMenuOpen, setFontMenuOpen] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-500 underline cursor-pointer',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'mx-auto my-2 max-w-full h-auto',
          },
        }),
        TextStyle,
        Color,
        FontFamily,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
      ],
      content,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    });

    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    useEffect(() => {
      // Keep state in sync with editor for text alignment
      if (editor) {
        const newAlign = editor.isActive({ textAlign: 'left' }) 
          ? 'left' 
          : editor.isActive({ textAlign: 'center' }) 
          ? 'center' 
          : editor.isActive({ textAlign: 'right' }) 
          ? 'right'
          : editor.isActive({ textAlign: 'justify' })
          ? 'justify'
          : 'left';
        
        if (newAlign !== currentTextAlign) {
          setCurrentTextAlign(newAlign);
        }
      }
    }, [editor, currentTextAlign]);

    const addLink = () => {
      if (!linkUrl) return;
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkMenuOpen(false);
    };

    const removeLink = () => {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    };

    const addImage = () => {
      if (!imageUrl) return;
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageMenuOpen(false);
    };

    const setColor = (color: string) => {
      editor?.chain().focus().setColor(color).run();
      setSelectedColor(color);
      setColorMenuOpen(false);
    };

    const setFont = (font: string) => {
      editor?.chain().focus().setFontFamily(font).run();
      setSelectedFont(font);
      setFontMenuOpen(false);
    };

    if (!editor) {
      return null;
    }

    return (
      <div className={cn("border rounded-md", className)} ref={ref}>
        <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/50">
          <ToggleGroup type="multiple">
            <ToggleGroupItem 
              value="bold" 
              size="sm"
              aria-label="Toggle bold"
              data-state={editor.isActive('bold') ? "on" : "off"}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="italic" 
              size="sm"
              aria-label="Toggle italic"
              data-state={editor.isActive('italic') ? "on" : "off"}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="underline" 
              size="sm"
              aria-label="Toggle underline"
              data-state={editor.isActive('underline') ? "on" : "off"}
              onClick={() => editor.chain().focus().setMark('underline').run()}
            >
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="strike" 
              size="sm"
              aria-label="Toggle strikethrough"
              data-state={editor.isActive('strike') ? "on" : "off"}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <ToggleGroup type="single" value={currentTextAlign}>
            <ToggleGroupItem 
              value="left" 
              size="sm"
              aria-label="Align left"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="center" 
              size="sm"
              aria-label="Align center"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="right" 
              size="sm"
              aria-label="Align right"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="justify" 
              size="sm"
              aria-label="Justify"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <AlignJustify className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Popover open={fontMenuOpen} onOpenChange={setFontMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Type className="h-4 w-4" />
                <span className="max-w-24 truncate hidden sm:inline-block">
                  {selectedFont}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Font Family</h4>
                <div className="grid gap-1.5 max-h-60 overflow-y-auto">
                  {fonts.map((font) => (
                    <Button 
                      key={font.value}
                      variant="ghost" 
                      className="justify-start h-8 px-2"
                      style={{ fontFamily: font.value }}
                      onClick={() => setFont(font.value)}
                    >
                      {font.label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover open={colorMenuOpen} onOpenChange={setColorMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Palette className="h-4 w-4" />
                <div 
                  className="w-4 h-4 rounded-sm border"
                  style={{ backgroundColor: selectedColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Text Color</h4>
                <div className="grid grid-cols-4 gap-1">
                  {colors.map((color) => (
                    <Button 
                      key={color.value}
                      variant="outline" 
                      className="w-12 h-8 p-0"
                      onClick={() => setColor(color.value)}
                    >
                      <div 
                        className="w-full h-full rounded-sm"
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Popover open={linkMenuOpen} onOpenChange={setLinkMenuOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn("h-8", editor.isActive('link') && "bg-muted")}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Insert Link</h4>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input 
                    id="url"
                    value={linkUrl} 
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex justify-between">
                  {editor.isActive('link') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={removeLink}
                    >
                      Remove
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    onClick={addLink}
                    disabled={!linkUrl}
                    className="ml-auto"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover open={imageMenuOpen} onOpenChange={setImageMenuOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Insert Image</h4>
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input 
                    id="image-url"
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    onClick={addImage}
                    disabled={!imageUrl}
                  >
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <ToggleGroup type="multiple" className="ml-auto">
            <ToggleGroupItem 
              value="bulletList" 
              size="sm"
              aria-label="Bullet list"
              data-state={editor.isActive('bulletList') ? "on" : "off"}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="orderedList" 
              size="sm"
              aria-label="Ordered list"
              data-state={editor.isActive('orderedList') ? "on" : "off"}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="h-4 w-4" />
            </ToggleGroupItem>
            
            <ToggleGroupItem 
              value="codeBlock" 
              size="sm"
              aria-label="Code block"
              data-state={editor.isActive('codeBlock') ? "on" : "off"}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <Code className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <EditorContent 
          editor={editor} 
          className="p-3 min-h-[200px] prose prose-sm max-w-none focus-visible:outline-none"
        />
        
        {editor && (
          <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 100 }}
            className="bg-background rounded-md shadow-md border flex overflow-hidden"
          >
            <Button 
              size="sm" 
              variant="ghost"
              className={cn(editor.isActive('bold') && "bg-muted")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className={cn(editor.isActive('italic') && "bg-muted")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className={cn(editor.isActive('link') && "bg-muted")}
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  setLinkMenuOpen(true);
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </BubbleMenu>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };