import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const checkInstitutionExists = async (
  institutionName: string
): Promise<{ exists: boolean; message: string }> => {
  try {
    // Create a case-insensitive query
    const normalizedName = institutionName.toLowerCase().trim();
    
    // Query Firestore for existing institutions
    const institutionsRef = collection(db, 'institutions');
    const q = query(
      institutionsRef,
      where('normalizedName', '==', normalizedName)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        exists: true,
        message: 'An institution with this name already exists'
      };
    }

    return {
      exists: false,
      message: 'Institution name is available'
    };
  } catch (error) {
    console.error('Error checking institution:', error);
    throw new Error('Failed to check institution availability');
  }
};

export const validateInstitutionName = (name: string): { isValid: boolean; message: string } => {
  // Remove extra spaces and check length
  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    return {
      isValid: false,
      message: 'Institution name must be at least 3 characters long'
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      message: 'Institution name must not exceed 100 characters'
    };
  }

  // Check for valid characters (letters, numbers, spaces, and basic punctuation)
  const validNameRegex = /^[a-zA-Z0-9\s\-\'\.,&]+$/;
  if (!validNameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Institution name contains invalid characters'
    };
  }

  return {
    isValid: true,
    message: 'Institution name is valid'
  };
};