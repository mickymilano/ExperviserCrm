import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileCsv, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  acceptedFormats: string;
}

export function FileUploader({ onFileSelected, acceptedFormats }: FileUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      // Verifica il formato del file
      const fileType = files[0].name.split('.').pop()?.toLowerCase();
      const formatsArray = acceptedFormats.split(',').map(format => 
        format.trim().replace('.', '').toLowerCase()
      );
      
      if (fileType && formatsArray.includes(fileType)) {
        onFileSelected(files[0]);
      } else {
        // Mostra un errore se il formato non è supportato
        alert(t('import.unsupportedFormat'));
      }
    }
  };

  return (
    <Card 
      className={`flex flex-col items-center justify-center border-2 border-dashed p-10 ${
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-200'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex justify-center mb-6 space-x-4">
        <FileCsv className="h-16 w-16 text-primary opacity-70" />
        <FileSpreadsheet className="h-16 w-16 text-green-600 opacity-70" />
      </div>
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-1">{t('import.dragAndDrop')}</h3>
        <p className="text-sm text-gray-500">{t('import.supportedFormats', { formats: acceptedFormats })}</p>
      </div>
      
      <Button onClick={handleBrowseClick} className="mb-2">
        <Upload className="mr-2 h-4 w-4" />
        {t('import.browseFiles')}
      </Button>
      
      <p className="text-xs text-gray-400">{t('import.maxFileSize')}</p>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFormats}
        className="hidden"
      />
    </Card>
  );
}