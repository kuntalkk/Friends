import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import { launchImageLibrary, MediaType } from 'react-native-image-picker';
import { Plus, Image as ImageIcon, Video as VideoIcon } from 'lucide-react-native';
import { db, getCurrentUserUID, ensureAuthenticated } from '@/services/firebase';
import { uploadToCloudinary } from '@/services/cloudinary';
import { AlbumItem, User } from '@/types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function AlbumTab() {
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Fetch current user data
    const fetchCurrentUser = async () => {
      try {
        const uid = getCurrentUserUID();
        if (uid) {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            setCurrentUser(userDoc.data() as User);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();

    // Subscribe to album items in real-time
    const unsubscribe = db
      .collection('albums')
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        (snapshot) => {
          const items: AlbumItem[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as AlbumItem);
          });
          setAlbumItems(items);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error fetching album items:', error);
          setIsLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  const pickMedia = () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          uploadMedia(asset.uri, asset.type?.startsWith('video') ? 'video' : 'image');
        }
      }
    });
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video') => {
    if (!currentUser) {
      Alert.alert('Error', 'Please complete your profile first');
      return;
    }

    setIsUploading(true);

    try {
      // Ensure user is authenticated
      await ensureAuthenticated();

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(uri, type);

      // Create album item
      const albumItem: Omit<AlbumItem, 'id'> = {
        url: cloudinaryUrl,
        uploaderName: currentUser.name,
        timestamp: Date.now(),
        type: type,
      };

      // Save to Firestore
      await db.collection('albums').add(albumItem);

      Alert.alert('Success', 'Media uploaded successfully!');
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderAlbumItem = ({ item }: { item: AlbumItem }) => {
    const uploadDate = new Date(item.timestamp).toLocaleDateString();

    return (
      <View style={styles.albumItem}>
        <View style={styles.mediaContainer}>
          {item.type === 'image' ? (
            <Image source={{ uri: item.url }} style={styles.media} />
          ) : (
            <Video
              source={{ uri: item.url }}
              style={styles.media}
              useNativeControls
              resizeMode="cover"
              shouldPlay={false}
            />
          )}
          <View style={styles.mediaTypeIndicator}>
            {item.type === 'image' ? (
              <ImageIcon size={16} color="#ffffff" />
            ) : (
              <VideoIcon size={16} color="#ffffff" />
            )}
          </View>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.uploaderName} numberOfLines={1}>
            {item.uploaderName}
          </Text>
          <Text style={styles.uploadDate}>{uploadDate}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>ALBUM</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading album...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ALBUM</Text>
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={pickMedia}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Plus size={20} color="#ffffff" />
          )}
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Add Media'}
          </Text>
        </TouchableOpacity>
      </View>

      {albumItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ImageIcon size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No media yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "Add Media" to upload your first photo or video
          </Text>
        </View>
      ) : (
        <FlatList
          data={albumItems}
          renderItem={renderAlbumItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 1,
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  albumItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mediaContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: '#f3f4f6',
  },
  mediaTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  itemInfo: {
    padding: 12,
  },
  uploaderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  uploadDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});