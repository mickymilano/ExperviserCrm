import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileX, FileCheck, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    // Verifica estensione
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      toast({
        title: t('importExport.invalidFileType'),
        description: t('importExport.supportedFormats', { formats: supportedFormats.join(', ') }),
        variant: 'destructive',
      });
      return;
    }

    // Verifica dimensione
    if (file.size > maxSizeInBytes) {
      toast({
        title: t('importExport.fileTooLarge'),
        description: t('importExport.maxFileSize', { size: maxSizeInMB }),
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    onFileUploaded(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSelectClick = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('importExport.uploadFile')}</CardTitle>
        <CardDescription>
          {t('importExport.uploadDescription', { formats: supportedFormats.join(', ') })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">{t('importExport.dragAndDrop')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('importExport.selectOrDrag', { maxSize: maxSizeInMB })}
            </p>
            <Button onClick={handleSelectClick} variant="outline">
              {t('importExport.selectFile')}
            </Button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={supportedFormats.join(',')}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-primary/10 rounded-md">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">{selectedFile.name}</h4>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-8 w-8 text-destructive"
              onClick={removeFile}
            >
              <FileX className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}