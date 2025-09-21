import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeFirebase } from '../firebase';

// Initialize Firebase storage
let storage: any = null;

function getStorageInstance() {
  if (!storage) {
    initializeFirebase();
    storage = getStorage();
  }
  return storage;
}

export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  try {
    const storage = getStorageInstance();
    
    // Create a reference to the file
    const imageRef = ref(storage, `profile-images/${userId}/${Date.now()}-${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(imageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
};

export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    const storage = getStorageInstance();
    
    // Extract the path from the URL
    // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media&token=...
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL');
    }
    
    // Decode the path (Firebase Storage encodes paths)
    const decodedPath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, decodedPath);
    
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting profile image:', error);
    // Don't throw error for deletion failures
  }
};

export const validateImageFile = (file: File): { isValid: boolean; message: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      message: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
    };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'Image size must be less than 5MB'
    };
  }
  
  return {
    isValid: true,
    message: 'Valid image file'
  };
};
