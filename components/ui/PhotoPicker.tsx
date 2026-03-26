import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { pickPhoto, takePhoto, uploadPhoto, getPhotoUrl } from '../../lib/photos';
import { Photo } from '../../lib/storage';
import { PDQ_BLUE, PDQ_DARK, PDQ_GRAY, PDQ_RED } from '../../constants/colors';

interface PhotoPickerProps {
  itemId: string;
  projectId: string;
  photos: Photo[];
  onPhotoAdded: (localUri: string, projectId: string, itemId: string) => Promise<void>;
  onPhotoRemoved: (photoId: string, storagePath: string) => Promise<void>;
}

export function PhotoPicker({
  itemId,
  projectId,
  photos,
  onPhotoAdded,
  onPhotoRemoved,
}: PhotoPickerProps) {
  const [uploading, setUploading] = useState(false);

  function handleAdd() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (index) => {
          if (index === 1) await doTakePhoto();
          else if (index === 2) await doPickPhoto();
        }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: doTakePhoto },
        { text: 'Choose from Library', onPress: doPickPhoto },
      ]);
    }
  }

  async function doTakePhoto() {
    const uri = await takePhoto();
    if (uri) await upload(uri);
  }

  async function doPickPhoto() {
    const uri = await pickPhoto();
    if (uri) await upload(uri);
  }

  async function upload(localUri: string) {
    setUploading(true);
    try {
      await onPhotoAdded(localUri, projectId, itemId);
    } catch (err: unknown) {
      Alert.alert('Upload Failed', err instanceof Error ? err.message : 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(photo: Photo) {
    Alert.alert('Remove Photo', 'Delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onPhotoRemoved(photo.id, photo.storage_path),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.thumb}>
            <PhotoThumb storagePath={photo.storage_path} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(photo)}
            >
              <Text style={styles.removeBtnText}>&#215;</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAdd}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color={PDQ_BLUE} size="small" />
          ) : (
            <>
              <Text style={styles.addIcon}>&#128247;</Text>
              <Text style={styles.addText}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PhotoThumb({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    getPhotoUrl(storagePath).then(setUrl).catch(() => null);
  }, [storagePath]);

  if (!url) {
    return <View style={styles.thumbPlaceholder} />;
  }

  return <Image source={{ uri: url }} style={styles.thumbImage} />;
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
  },
  thumb: {
    position: 'relative',
    marginRight: 8,
  },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: PDQ_RED,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  addBtn: {
    width: 64,
    height: 64,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: PDQ_BLUE,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  addIcon: {
    fontSize: 18,
  },
  addText: {
    fontSize: 10,
    color: PDQ_BLUE,
    fontWeight: '600',
  },
});
