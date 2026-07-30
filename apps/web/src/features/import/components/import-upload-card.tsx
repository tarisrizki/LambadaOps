'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileType, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUploadAssets } from '../api/mutations';

export function ImportUploadCard() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadAssets();

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
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
    } else {
      alert('Only .xlsx files are supported');
    }
  };

  const onUploadClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile, {
        onSuccess: () => {
          setSelectedFile(null);
        }
      });
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Assets</CardTitle>
        <CardDescription>Upload an Excel (.xlsx) file to bulk import assets into your inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".xlsx"
            onChange={handleChange}
          />
          
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={onUploadClick}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">Excel (.xlsx) files only</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-4">
                <FileType className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium leading-none">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearSelection} disabled={uploadMutation.isPending}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6 bg-muted/20">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Start Import'}
        </Button>
      </CardFooter>
    </Card>
  );
}
