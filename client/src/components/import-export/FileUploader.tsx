import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X } from 'lucide-react';

interface FileUploaderProps {
  onFileUploaded: (file: File) => void;
  supportedFormats?: string[];
  maxSizeInMB?: number;
}

export function FileUploader({ 
  onFileUploaded, 
  supportedFormats = ['.csv', '.xlsx', '.xls'], 
  maxSizeInMB = 10 
}: FileUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  const validateAndSetFile = (file: File) => {
    // Verifica formato file
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidFormat = supportedFormats.some(format => 
      format.toLowerCase() === fileExtension
    );
    
    if (!isValidFormat) {
      setError(t('importExport.invalidFormat', { 
        formats: supportedFormats.join(', ') 
      }));
      return;
    }
    
    // Verifica dimensione file
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(t('importExport.fileTooLarge', { maxSize: maxSizeInMB }));
      return;
    }
    
    setFile(file);
    setError(null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const confirmFile = () => {
    if (file) {
      onFileUploaded(file);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('importExport.uploadFile')}</CardTitle>
        <CardDescription>
          {t('importExport.uploadFileDescription', { 
            formats: supportedFormats.join(', '), 
            maxSize: maxSizeInMB 
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={supportedFormats.join(',')}
        />
        
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onClick={openFileDialog}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">
              {t('importExport.dragAndDrop')}
            </p>
            <p className="text-xs text-muted-foreground/70 mb-6">
              {t('importExport.supportedFormats', { formats: supportedFormats.join(', ') })}
            </p>
            <Button type="button" variant="outline" onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}>
              {t('importExport.selectFile')}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg p-6 border">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <File className="h-8 w-8 mr-3 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={confirmFile}>{t('importExport.continue')}</Button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}