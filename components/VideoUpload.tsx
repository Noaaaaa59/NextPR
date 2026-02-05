'use client';

import { useState, useRef } from 'react';
import { Video, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadLiftVideo, deleteLiftVideo } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  userId: string;
  liftId: string;
  existingVideoUrl?: string;
  onUploadComplete?: (url: string) => void;
  onDelete?: () => void;
}

export function VideoUpload({
  userId,
  liftId,
  existingVideoUrl,
  onUploadComplete,
  onDelete,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(existingVideoUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Sélectionne un fichier vidéo');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('La vidéo ne doit pas dépasser 100MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const url = await uploadLiftVideo(userId, liftId, file);
      setVideoUrl(url);
      onUploadComplete?.(url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLiftVideo(userId, liftId);
      setVideoUrl(undefined);
      onDelete?.();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  if (videoUrl) {
    return (
      <div className="space-y-2">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            playsInline
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Ta vidéo sera visible par les autres utilisateurs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'w-full p-6 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center gap-2',
          uploading
            ? 'border-primary/50 bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Téléchargement...</span>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium">Ajouter une vidéo</span>
            <span className="text-xs text-muted-foreground">
              MP4, MOV, WebM - Max 100MB
            </span>
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-center text-destructive">{error}</p>
      )}
    </div>
  );
}
