export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  // For base64 images, we don't need to delete from storage
  // The image will be replaced when a new one is uploaded
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
  
  // Check file size (max 1MB for base64 to avoid Firestore limits)
  const maxSize = 1 * 1024 * 1024; // 1MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'Image size must be less than 1MB for base64 storage'
    };
  }
  
  return {
    isValid: true,
    message: 'Valid image file'
  };
};
