import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, limit, updateDoc, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { UserProfile, AdminProfile, AdminSettings, TimetableData, AdministrativeData, Organization } from './types';

// Firebase configuration
const firebaseConfig = {
   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
   appId: import.meta.env.VITE_FIREBASE_APP_ID,
   measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey) {
  console.error('Firebase API Key is missing. Please check your environment variables.');
  throw new Error('Firebase API Key is required');
}

if (!firebaseConfig.authDomain) {
  console.error('Firebase Auth Domain is missing. Please check your environment variables.');
  throw new Error('Firebase Auth Domain is required');
}

if (!firebaseConfig.projectId) {
  console.error('Firebase Project ID is missing. Please check your environment variables.');
  throw new Error('Firebase Project ID is required');
}

// Initialize Firebase only when needed
let auth;
let googleProvider;
let db;

export function initializeFirebase() {
    if (!getApps().length) {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        // Ensure persistence so auto-login works after refresh/new tab
        setPersistence(auth, browserLocalPersistence).catch(() => {/* noop */});
        googleProvider = new GoogleAuthProvider();
        // Improve connectivity in restrictive networks by forcing/auto-detecting long polling
        db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

        // Optional: use local emulators during development
        if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
            try {
                connectFirestoreEmulator(db, '127.0.0.1', Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT) || 8080);
                connectAuthEmulator(auth, `http://127.0.0.1:${Number(import.meta.env.VITE_AUTH_EMULATOR_PORT) || 9099}`);
            } catch {/* noop */}
        }
    }
    return { auth, googleProvider, db };
}

// Helper to create a safe organization key for doc IDs/fields
function sanitizeOrgKey(organizationName: string) {
    return organizationName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, '-');
}

// Generate a unique 6-digit organization token
function generateOrgToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if a token already exists (now checking within user documents)
async function isTokenUnique(token: string): Promise<boolean> {
    if (!db) initializeFirebase();
    const q = query(collection(db, 'users'), where('organization.token', '==', token));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

// User data functions
export async function createUserProfile(userId: string, userData: UserProfile) {
    if (!db) initializeFirebase();
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, userData, { merge: true });
}

export async function getUserProfile(userId: string) {
    if (!db) initializeFirebase();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        // Ensure uid is always present
        return { ...userData, uid: userId };
    }
    return null;
}

export async function checkUserProfileExists(userId: string): Promise<boolean> {
    if (!db) initializeFirebase();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() && userSnap.data()?.profileCompleted === true;
}

// Admin data
export async function setAdminProfile(adminUid: string, profile: AdminProfile) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'admins', adminUid);
    await setDoc(ref, profile, { merge: true });
}

export async function getAdminProfile(adminUid: string) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'admins', adminUid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as AdminProfile : null;
}

export async function setAdminSettings(settings: AdminSettings) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'config', 'adminSettings');
    await setDoc(ref, settings, { merge: true });
}

export async function getAdminSettings() {
    if (!db) initializeFirebase();
    const ref = doc(db, 'config', 'adminSettings');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as AdminSettings : null;
}

// Timetables: store per student or global versioned timetables
export async function setUserTimetable(userUid: string, timetable: TimetableData) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'timetables', userUid);
    await setDoc(ref, { data: timetable }, { merge: true });
}

export async function getUserTimetable(userUid: string) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'timetables', userUid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as { data: TimetableData }).data : null;
}

// Organization-level timetable functions
export async function setOrgTimetable(organizationToken: string, timetableData: TimetableData, isPublished: boolean) {
    if (!db) initializeFirebase();
    if (!auth?.currentUser) {
        throw new Error('User not authenticated');
    }
    
    try {
        // First verify organization and permissions
        const organization = await getOrganizationByToken(organizationToken);
        if (!organization) {
            throw new Error('Organization not found');
        }
        if (organization.adminId !== auth.currentUser.uid) {
            throw new Error('Unauthorized to update timetable');
        }

        // Save timetable data in organization's collection
        const timetableRef = doc(db, 'organizations', organizationToken);
        await setDoc(timetableRef, {
            timetableData,
            lastUpdated: Date.now(),
            isPublished,
            adminId: auth.currentUser.uid
        }, { merge: true });

        // Update user's organization document
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
            'organization.lastUpdated': Date.now(),
            'organization.isPublished': isPublished
        });

        console.log('Timetable saved successfully');
    } catch (error) {
        console.error('Error saving timetable:', error);
        throw error;
    }
}

export async function getOrgTimetable(organizationToken?: string | null) {
    if (!db) initializeFirebase();
    if (!organizationToken) return null;
    if (!auth?.currentUser) {
        console.warn('User not authenticated, cannot get timetable');
        return null;
    }
    try {
        const organization = await getOrganizationByToken(organizationToken);
        if (!organization) {
            return null;
        }
        
        return organization.timetableData || null;
    } catch (error) {
        console.error('Error getting timetable:', error);
        return null;
    }
}

export async function publishTimetable(organizationToken: string) {
    if (!db) initializeFirebase();
    if (!auth?.currentUser) {
        throw new Error('User not authenticated');
    }
    
    try {
        const organization = await getOrganizationByToken(organizationToken);
        if (!organization) {
            throw new Error('Organization not found');
        }
        
        if (organization.adminId !== auth.currentUser.uid) {
            throw new Error('Only organization admin can publish timetable');
        }
        
        // Update publish status in both user's organization and organization document
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const orgRef = doc(db, 'organizations', organization.id);
        
        await Promise.all([
            setDoc(userRef, { 
                'organization.isPublished': true,
                'organization.publishedAt': Date.now() 
            }, { merge: true }),
            setDoc(orgRef, { 
                isPublished: true,
                publishedAt: Date.now() 
            }, { merge: true })
        ]);
    } catch (error) {
        console.error('Error publishing timetable:', error);
        throw error;
    }
}

export async function saveOrgTimetable(organizationToken: string, timetableData: TimetableData) {
    if (!db) initializeFirebase();
    if (!auth?.currentUser) {
        throw new Error('User not authenticated');
    }
    
    try {
        const organization = await getOrganizationByToken(organizationToken);
        if (!organization) {
            throw new Error('Organization not found');
        }
        
        if (organization.adminId !== auth.currentUser.uid) {
            throw new Error('Only organization admin can save timetable');
        }
        
        // Update timetable data in user's organization
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { 
            'organization.timetableData': timetableData,
            'organization.lastUpdated': Date.now(),
            'organization.isPublished': false // Save as draft initially
        }, { merge: true });
    } catch (error) {
        console.error('Error saving timetable:', error);
        throw error;
    }
}

// Query helper for students/faculty to raise issues (simple doc per user for now)
export async function raiseTimetableQuery(userUid: string, message: string) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'queries', userUid);
    await setDoc(ref, { message, createdAt: Date.now() }, { merge: true });
}

// Organization management functions
export async function createOrganization(adminId: string, organizationName: string): Promise<string> {
    if (!db) initializeFirebase();
    if (!auth?.currentUser) {
        throw new Error('User not authenticated');
    }
    
    try {
        // Check if admin already has an organization
        const userRef = doc(db, 'users', adminId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data()?.organization) {
            // Return existing token instead of creating new one
            return userSnap.data().organization.token;
        }
        
        // Generate unique token
        let token: string;
        let isUnique = false;
        let attempts = 0;
        
        do {
            token = generateOrgToken();
            isUnique = await isTokenUnique(token);
            attempts++;
        } while (!isUnique && attempts < 10);
        
        if (!isUnique) {
            throw new Error('Failed to generate unique token');
        }
        
        const organization: Organization = {
            id: sanitizeOrgKey(organizationName),
            name: organizationName,
            token: token,
            adminId: adminId,
            createdAt: Date.now(),
            isPublished: false
        };
        
        // Store organization inside user document
        await setDoc(userRef, { 
            organization: organization 
        }, { merge: true });
        
        return token;
    } catch (error) {
        console.error('Error creating organization:', error);
        throw error;
    }
}

export async function getOrganizationByToken(token: string): Promise<Organization | null> {
    if (!db) initializeFirebase();
    if (!auth?.currentUser) {
        throw new Error('User not authenticated');
    }

    try {
        // First check in organizations collection
        const orgRef = doc(db, 'organizations', token);
        const orgDoc = await getDoc(orgRef);

        if (orgDoc.exists()) {
            const orgData = orgDoc.data();
            return {
                id: orgData.id || token,
                name: orgData.name,
                token: token,
                adminId: orgData.adminId,
                createdAt: orgData.createdAt,
                administrativeData: orgData.administrativeData,
                timetableData: orgData.timetableData,
                isPublished: orgData.isPublished || false
            } as Organization;
        }

        // If not found in organizations, check in users collection as fallback
        const q = query(
            collection(db, 'users'),
            where('organization.token', '==', token),
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            console.warn('No organization found with token:', token);
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (!userData.organization) {
            console.warn('User document does not contain organization data');
            return null;
        }

        return {
            ...userData.organization,
            id: userData.organization.id || token,
            token: token,
            adminId: userDoc.id,
            createdAt: userData.organization.createdAt || Date.now(),
            isPublished: false
        } as Organization;
    } catch (error) {
        console.error('Error getting organization by token:', error);
        return null;
    }
}

export async function getOrganizationByAdminId(adminId: string): Promise<Organization | null> {
    if (!db) initializeFirebase();
    try {
        const userRef = doc(db, 'users', adminId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists() || !userSnap.data()?.organization) {
            return null;
        }
        
        return userSnap.data().organization as Organization;
    } catch (error) {
        console.error('Error getting organization by admin ID:', error);
        return null;
    }
}

// Administrative data functions (now organization-based)
export async function setAdministrativeData(organizationToken: string, data: AdministrativeData) {
    if (!db) initializeFirebase();
    if (!auth?.currentUser) {
        console.warn('User not authenticated, cannot save administrative data');
        return;
    }
    try {
        const organization = await getOrganizationByToken(organizationToken);
        if (!organization) {
            throw new Error('Organization not found');
        }
        
        if (organization.adminId !== auth.currentUser.uid) {
            throw new Error('Only organization admin can update administrative data');
        }
        
        const toSave: AdministrativeData = {
            departments: data.departments || [],
            faculties: data.faculties || [],
            students: data.students || [],
            rooms: data.rooms || [],
            subjects: data.subjects || [],
            sentiment: data.sentiment || '',
            lastUpdated: Date.now()
        };
        
        // Update administrative data in user's organization
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        // First get the current user document to ensure organization exists
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            throw new Error('User document does not exist');
        }
        
        const userData = userDoc.data();
        const updatedUserData = {
            ...userData,
            organization: {
                ...userData.organization,
                administrativeData: toSave
            }
        };
        
        await setDoc(userRef, updatedUserData);
    } catch (error) {
        console.error('Firestore: Error saving administrative data:', error);
        throw error;
    }
}

export async function getAdministrativeData(organizationToken?: string | null) {
    if (!db) initializeFirebase();
    if (!organizationToken) {
        console.log('getAdministrativeData: No organization token provided');
        return null;
    }
    if (!auth?.currentUser) {
        console.warn('User not authenticated, cannot get administrative data');
        return null;
    }
    try {
        console.log('getAdministrativeData: Getting data for user:', auth.currentUser.uid, 'token:', organizationToken);
        // Get data from current user's organization (where it was saved)
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            console.log('getAdministrativeData: User document does not exist');
            return null;
        }
        
        const userData = userDoc.data();
        console.log('getAdministrativeData: User data:', userData);
        const organization = userData.organization;
        
        // Verify the user has the correct organization token
        if (!organization || organization.token !== organizationToken) {
            console.log('getAdministrativeData: Organization token mismatch or missing organization');
            console.log('Expected token:', organizationToken, 'Found token:', organization?.token);
            return null;
        }
        
        console.log('getAdministrativeData: Returning administrative data:', organization.administrativeData);
        return organization.administrativeData || null;
    } catch (error) {
        console.error('Error getting administrative data:', error);
        return null;
    }
}

// Helper to fetch full admin context for TT generation
export async function getAdminContextForOrg(organizationToken?: string | null) {
    const data = await getAdministrativeData(organizationToken);
    return data;
}

// Query submission function
export async function submitUserQuery(queryData: { name: string; email: string; subject: string; message: string }) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'queries', Date.now().toString());
    await setDoc(ref, {
        ...queryData,
        submittedAt: Date.now(),
        status: 'pending'
    });
}

// Export getters that ensure Firebase is initialized
export function getFirebaseAuth() {
    if (!auth) {
        initializeFirebase();
    }
    return auth;
}

export function getGoogleProvider() {
    if (!googleProvider) {
        initializeFirebase();
    }
    return googleProvider;
}

export function getFirestoreDb() {
    if (!db) {
        initializeFirebase();
    }
    return db;
} 