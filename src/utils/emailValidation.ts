// Email validation with format check and common domain validation
export const validateEmail = async (email: string): Promise<{ isValid: boolean; message: string }> => {
  // Basic format validation - more permissive regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: "Invalid email format"
    };
  }

  // Check for common invalid patterns
  const domain = email.split('@')[1].toLowerCase();
  
  // List of common valid email providers
  const validProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com',
    'edu', 'ac.in', 'edu.in', 'sch.in', 'org', 'net', 'com'
  ];

  // Check if domain ends with a valid provider or TLD
  const isValidDomain = validProviders.some(provider => 
    domain === provider || domain.endsWith('.' + provider)
  );

  if (!isValidDomain) {
    return {
      isValid: false,
      message: "Please use a valid email provider"
    };
  }

  // Additional checks for common mistakes
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return {
      isValid: false,
      message: "Invalid email domain format"
    };
  }

  return {
    isValid: true,
    message: "Email is valid"
  };
};

// Common education email domains
const educationDomains = [
  'edu',
  'ac.in',
  'edu.in',
  'sch.in',
  // Add more education domains as needed
];

export const isEducationalEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split('@')[1];
  return educationDomains.some(eduDomain => domain.endsWith(eduDomain));
};

// Function to check if email belongs to staff domain
export const isStaffEmail = (email: string, institutionDomain: string): boolean => {
  const emailDomain = email.toLowerCase().split('@')[1];
  return emailDomain === institutionDomain;
};
