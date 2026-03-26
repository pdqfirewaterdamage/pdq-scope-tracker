import { useState, useEffect, useCallback } from 'react';
import { Photo, getPhotos, createPhoto, deletePhotoRecord } from '../lib/storage';
import { uploadPhoto, deletePhoto as deleteFromStorage } from '../lib/photos';
import { supabase } from '../lib/supabase';

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  addPhoto: (localUri: string, projectId: string, itemId: string) => Promise<void>;
  removePhoto: (photoId: string, storagePath: string) => Promise<void>;
}

export function usePhotos(itemId: string): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPhotos(itemId);
      setPhotos(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPhoto = useCallback(
    async (localUri: string, projectId: string, _itemId: string) => {
      setUploading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const storagePath = await uploadPhoto(localUri, projectId, _itemId);
        const photo = await createPhoto({
          item_id: _itemId,
          room_id: null,
          project_id: projectId,
          storage_path: storagePath,
          caption: null,
          created_by: user?.id ?? null,
        });
        setPhotos((prev) => [...prev, photo]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to upload photo');
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const removePhoto = useCallback(async (photoId: string, storagePath: string) => {
    setError(null);
    try {
      await deleteFromStorage(photoId, storagePath);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  }, []);

  return { photos, loading, uploading, error, addPhoto, removePhoto };
}
