import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  BibleTranslationId,
  CrossReferenceEdge,
  FirebaseUserSummary,
  HighlightColor,
  SavedGraphConfig,
  SharedStudyCollection,
  StudyCollection,
  UserStudyState,
} from '../types/scripture';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const isNodeTestEnv = typeof window === 'undefined';

const app = !isNodeTestEnv
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const auth = app ? getAuth(app) : null;

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (!isNodeTestEnv) {
  void testConnection();
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function toUserSummary(user: User | null): FirebaseUserSummary | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function subscribeAuthState(
  cb: (user: FirebaseUserSummary | null) => void
): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user) => {
    cb(toUserSummary(user));
  });
}

export async function signInWithGoogle(): Promise<FirebaseUserSummary | null> {
  if (!auth) return null;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  if (cred.user && cred.user.emailVerified) {
    await upsertUserPrivateProfile(cred.user);
  }
  return toUserSummary(cred.user);
}

export async function signOutFirebase(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function upsertUserPrivateProfile(user: User): Promise<void> {
  if (!db || !user.email) return;
  const path = `users/${user.uid}/private/profile`;
  const ref = doc(db, 'users', user.uid, 'private', 'profile');
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(
        ref,
        {
          uid: user.uid,
          email: user.email.slice(0, 254),
          displayName: (user.displayName ?? '').slice(0, 120),
          photoURL: (user.photoURL ?? '').slice(0, 512),
          createdAt: snap.data().createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email.slice(0, 254),
        displayName: (user.displayName ?? '').slice(0, 120),
        photoURL: (user.photoURL ?? '').slice(0, 512),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function sanitizeStudyStateForFirestore(uid: string, state: UserStudyState) {
  const allowedTranslations = new Set<BibleTranslationId>(['KJV', 'ASV', 'YLT']);
  const preferredTranslation: BibleTranslationId =
    state.preferredTranslation && allowedTranslations.has(state.preferredTranslation)
      ? state.preferredTranslation
      : 'KJV';

  const bookmarks = (state.bookmarks ?? [])
    .filter((id): id is string => typeof id === 'string' && id.length <= 32)
    .slice(0, 500);

  const readChapters = (state.readChapters ?? [])
    .filter((ch): ch is string => typeof ch === 'string' && ch.length <= 16)
    .slice(0, 1189);

  const recentSearches = (state.recentSearches ?? [])
    .filter((s): s is string => typeof s === 'string' && s.length <= 120)
    .slice(0, 12);

  const highlights: Record<string, HighlightColor> = {};
  let hlCount = 0;
  for (const [k, v] of Object.entries(state.highlights ?? {})) {
    if (hlCount >= 1000) break;
    if (k.length <= 32) {
      highlights[k] = v;
      hlCount += 1;
    }
  }

  const notes: Record<string, string> = {};
  let noteCount = 0;
  for (const [k, v] of Object.entries(state.notes ?? {})) {
    if (noteCount >= 1000) break;
    if (k.length <= 32 && typeof v === 'string' && v.trim()) {
      notes[k] = v.slice(0, 4000);
      noteCount += 1;
    }
  }

  const collections: StudyCollection[] = (state.collections ?? [])
    .slice(0, 50)
    .map((c) => ({
      id: String(c.id).slice(0, 64),
      title: String(c.title).slice(0, 120),
      description: String(c.description ?? '').slice(0, 600),
      verseIds: (c.verseIds ?? []).slice(0, 200),
      isSystem: Boolean(c.isSystem),
      createdAt: c.createdAt ?? new Date().toISOString(),
      updatedAt: c.updatedAt ?? new Date().toISOString(),
    }));

  const savedGraphs: SavedGraphConfig[] = (state.savedGraphs ?? []).slice(0, 24);
  const customEdges: CrossReferenceEdge[] = (state.customEdges ?? [])
    .slice(0, 250)
    .map((e) => ({
      ...e,
      id: String(e.id).slice(0, 96),
      explanation: String(e.explanation ?? '').slice(0, 500),
      sourceAttribution: String(e.sourceAttribution ?? 'Personal Study').slice(0, 140),
    }));

  return {
    ownerId: uid,
    preferredTranslation,
    bookmarks,
    readChapters,
    recentSearches,
    highlights,
    notes,
    collections,
    savedGraphs,
    customEdges,
  };
}

function docToStudyState(raw: Record<string, unknown>): Partial<UserStudyState> {
  return {
    preferredTranslation: raw.preferredTranslation as BibleTranslationId | undefined,
    bookmarks: Array.isArray(raw.bookmarks) ? (raw.bookmarks as string[]) : undefined,
    readChapters: Array.isArray(raw.readChapters) ? (raw.readChapters as string[]) : undefined,
    recentSearches: Array.isArray(raw.recentSearches) ? (raw.recentSearches as string[]) : undefined,
    highlights: (raw.highlights as Record<string, HighlightColor>) ?? undefined,
    notes: (raw.notes as Record<string, string>) ?? undefined,
    collections: Array.isArray(raw.collections) ? (raw.collections as StudyCollection[]) : undefined,
    savedGraphs: Array.isArray(raw.savedGraphs) ? (raw.savedGraphs as SavedGraphConfig[]) : undefined,
    customEdges: Array.isArray(raw.customEdges) ? (raw.customEdges as CrossReferenceEdge[]) : undefined,
  };
}

export async function loadCloudStudyState(
  uid: string
): Promise<Partial<UserStudyState> | null> {
  if (!db) return null;
  const path = `users/${uid}/studyState/main`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'studyState', 'main'));
    if (!snap.exists()) return null;
    return docToStudyState(snap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudStudyState(
  uid: string,
  state: UserStudyState
): Promise<void> {
  if (!db) return;
  const path = `users/${uid}/studyState/main`;
  const ref = doc(db, 'users', uid, 'studyState', 'main');
  const sanitized = sanitizeStudyStateForFirestore(uid, state);
  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await setDoc(
        ref,
        {
          ...sanitized,
          createdAt: existingSnap.data().createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: false }
      );
    } else {
      await setDoc(ref, {
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeCloudStudyState(
  uid: string,
  onData: (partial: Partial<UserStudyState>) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  if (!db) return () => {};
  const path = `users/${uid}/studyState/main`;
  const ref = doc(db, 'users', uid, 'studyState', 'main');
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData(docToStudyState(snap.data()));
      }
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

function generateShareId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${slug || 'study'}-${rand}`;
}

export async function publishSharedCollection(
  user: FirebaseUserSummary,
  col: StudyCollection
): Promise<SharedStudyCollection> {
  if (!db) throw new Error('Firestore is unavailable.');
  const shareId = generateShareId(col.title);
  const path = `sharedCollections/${shareId}`;
  const authorLabel = (user.displayName?.split(' ')[0] || 'Scripture Atlas Scholar').slice(0, 80);
  const payload = {
    shareId,
    ownerId: user.uid,
    authorLabel,
    title: col.title.trim().slice(0, 120) || 'Shared Study Collection',
    description: (col.description ?? '').trim().slice(0, 600),
    verseIds: (col.verseIds ?? []).slice(0, 200),
  };

  try {
    await setDoc(doc(db, 'sharedCollections', shareId), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchSharedCollection(
  shareId: string
): Promise<SharedStudyCollection | null> {
  if (!db) return null;
  const cleanId = shareId.trim();
  if (!/^[a-zA-Z0-9_-]{4,64}$/.test(cleanId)) return null;
  const path = `sharedCollections/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'sharedCollections', cleanId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      shareId: String(d.shareId ?? cleanId),
      ownerId: String(d.ownerId ?? ''),
      authorLabel: String(d.authorLabel ?? 'Scholar'),
      title: String(d.title ?? 'Shared Study Collection'),
      description: String(d.description ?? ''),
      verseIds: Array.isArray(d.verseIds) ? (d.verseIds as string[]) : [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function listMySharedCollections(
  uid: string
): Promise<SharedStudyCollection[]> {
  if (!db) return [];
  const path = 'sharedCollections';
  try {
    const q = query(collection(db, 'sharedCollections'), where('ownerId', '==', uid));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => {
      const data = d.data();
      return {
        shareId: String(data.shareId ?? d.id),
        ownerId: String(data.ownerId ?? uid),
        authorLabel: String(data.authorLabel ?? 'Scholar'),
        title: String(data.title ?? 'Shared Collection'),
        description: String(data.description ?? ''),
        verseIds: Array.isArray(data.verseIds) ? (data.verseIds as string[]) : [],
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteSharedCollection(shareId: string): Promise<void> {
  if (!db) return;
  const path = `sharedCollections/${shareId}`;
  try {
    await deleteDoc(doc(db, 'sharedCollections', shareId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
