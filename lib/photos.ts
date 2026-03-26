import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function pickPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0].uri;
}

export async function uploadPhoto(
  localUri: string,
  projectId: string,
  itemId: string
): Promise<string> {
  const filename = `${projectId}/${itemId}/${Date.now()}.jpg`;

  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist at provided URI');
  }

  // Read file as base64 then convert to Uint8Array
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  const { error } = await supabase.storage
    .from('photos')
    .upload(filename, byteArray, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  return filename;
}

export async function getPhotoUrl(storagePath: string): Promise<string> {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deletePhoto(photoId: string, storagePath: string): Promise<void> {
  // Remove from storage
  const { error: storageError } = await supabase.storage
    .from('photos')
    .remove([storagePath]);

  if (storageError) throw storageError;

  // Remove from database
  const { error: dbError } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId);

  if (dbError) throw dbError;
}
