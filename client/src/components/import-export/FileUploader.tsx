import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  accept?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function FileUploader({
  onFileSelect,
  isLoading = false,
  accept = '.csv, .xlsx, .xls',
  buttonText = 'Seleziona File',
  buttonVariant = 'outline'
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <Button 
        onClick={handleButtonClick} 
        variant={buttonVariant}
        disabled={isLoading}
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Caricamento...
          </>
        ) : (
          buttonText
        )}
      </Button>
      {fileName && (
        <p className="mt-2 text-xs text-muted-foreground">
          File selezionato: {fileName}
        </p>
      )}
    </div>
  );
}