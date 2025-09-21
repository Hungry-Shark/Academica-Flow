// Cloudinary configuration
// Get these from your Cloudinary dashboard
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzx1xoil6'; // Replace with your actual cloud name
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'academica-flow-preset';

export const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('public_id', `profile-images/${userId}/${Date.now()}`);
    formData.append('folder', 'academica-flow/profile-images');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
};

export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from Cloudinary URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const publicId = pathParts[pathParts.length - 1].split('.')[0];
    
    // Note: For deletion, you'd need to use Cloudinary's admin API
    // In a real implementation, you'd call Cloudinary's delete API here
    // This requires server-side implementation for security
  } catch (error) {
    console.error('Error deleting profile image:', error);
    // Don't throw error for deletion failures
  }
};

export const validateImageFile = (file: File): { isValid: boolean; message: string } => {
  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      message: 'No file selected'
    };
  }

  // Check file type by MIME type (more secure than extension)
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

  // Check for minimum file size (prevent empty files)
  const minSize = 100; // 100 bytes
  if (file.size < minSize) {
    return {
      isValid: false,
      message: 'File appears to be empty or corrupted'
    };
  }
  
  // Check file name for malicious patterns
  const maliciousPatterns = /\.(exe|bat|cmd|scr|pif|com|sh|ps1|vbs|js|jar|php|asp|jsp)$/i;
  if (maliciousPatterns.test(file.name)) {
    return {
      isValid: false,
      message: 'File type not allowed for security reasons'
    };
  }

  // Check for suspicious file names
  const suspiciousPatterns = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  if (suspiciousPatterns.test(file.name.split('.')[0])) {
    return {
      isValid: false,
      message: 'Invalid file name'
    };
  }

  // Check file name length
  if (file.name.length > 255) {
    return {
      isValid: false,
      message: 'File name too long'
    };
  }
  
  return {
    isValid: true,
    message: 'Valid image file'
  };
};
