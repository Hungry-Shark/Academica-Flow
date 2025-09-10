import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile, AdminProfile, AdminSettings, TimetableData, AdministrativeData } from './types';

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
        db = getFirestore(app);
    }
    return { auth, googleProvider, db };
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
    return userSnap.exists() ? userSnap.data() as UserProfile : null;
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

// Organization-level timetable keyed by college/school name
export async function setOrgTimetable(organizationName: string, timetable: TimetableData) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'orgTimetables', organizationName.toLowerCase());
    await setDoc(ref, { data: timetable, updatedAt: Date.now() }, { merge: true });
}

export async function getOrgTimetable(organizationName?: string | null) {
    if (!db) initializeFirebase();
    if (!organizationName) return null;
    const ref = doc(db, 'orgTimetables', organizationName.toLowerCase());
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as { data: TimetableData }).data : null;
}

// Query helper for students/faculty to raise issues (simple doc per user for now)
export async function raiseTimetableQuery(userUid: string, message: string) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'queries', userUid);
    await setDoc(ref, { message, createdAt: Date.now() }, { merge: true });
}

// Administrative data functions
export async function setAdministrativeData(organizationName: string, data: AdministrativeData) {
    if (!db) initializeFirebase();
    const ref = doc(db, 'administrativeData', organizationName.toLowerCase());
    await setDoc(ref, { ...data, lastUpdated: Date.now() }, { merge: true });
}

export async function getAdministrativeData(organizationName?: string | null) {
    if (!db) initializeFirebase();
    if (!organizationName) return null;
    const ref = doc(db, 'administrativeData', organizationName.toLowerCase());
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as AdministrativeData : null;
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