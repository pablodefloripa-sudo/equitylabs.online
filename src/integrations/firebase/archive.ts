import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { firebaseDb } from './client';

export type FirestoreArchiveMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model?: string;
  agentId?: string;
  agentRoute?: string;
  provider?: string;
  route?: string;
  mascot?: boolean;
};

export type FirestoreArchiveSession = {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  messageCount: number;
  lastMessage: string;
  models: string[];
  messages: FirestoreArchiveMessage[];
  context?: unknown;
  source?: string;
  createdAt: string;
  updatedAt: string;
};

export type FirestoreMascotSnapshot = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  config: unknown;
  createdAt: string;
  updatedAt: string;
};

export type SaveArchiveSessionInput = {
  userId: string;
  projectId: string;
  projectName: string;
  messages: FirestoreArchiveMessage[];
  context?: unknown;
  source?: string;
};

export type SaveMascotSnapshotInput = {
  userId: string;
  name: string;
  isActive: boolean;
  config: unknown;
};

export type SaveUserMirrorInput = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  provider?: string | null;
  lastLoginAt?: string | null;
};

const CHAT_COLLECTION = 'eq_chat_sessions';
const MASCOT_COLLECTION = 'eq_mascots';
const USER_COLLECTION = 'eq_users';

const makeDocId = (userId: string, key: string) => `${userId}__${key}`;

const cleanText = (value: string) => value.trim();

const normalizeMessages = (messages: FirestoreArchiveMessage[]) =>
  messages
    .filter((message) => cleanText(message.content).length > 0)
    .slice(-500)
    .map((message) => ({
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
    }));

export const saveUserMirror = async ({ userId, email, fullName, provider, lastLoginAt }: SaveUserMirrorInput) => {
  try {
    await setDoc(doc(firebaseDb, USER_COLLECTION, userId), {
      id: userId,
      email: email || null,
      fullName: fullName || null,
      provider: provider || null,
      lastLoginAt: lastLoginAt || null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch {
    // Firestore mirror is best-effort.
  }
};

export const saveArchiveSession = async ({
  userId,
  projectId,
  projectName,
  messages,
  context,
  source = 'supabase',
}: SaveArchiveSessionInput) => {
  try {
    const normalizedMessages = normalizeMessages(messages);
    const createdAt = normalizedMessages[0]?.timestamp || new Date().toISOString();
    const updatedAt = normalizedMessages[normalizedMessages.length - 1]?.timestamp || new Date().toISOString();
    const models = Array.from(
      new Set(
        normalizedMessages
          .map((message) => message.model)
          .filter((model): model is string => Boolean(model && model.trim())),
      ),
    );

    const payload: FirestoreArchiveSession = {
      id: makeDocId(userId, projectId),
      userId,
      projectId,
      projectName,
      messageCount: normalizedMessages.length,
      lastMessage: normalizedMessages[normalizedMessages.length - 1]?.content || '',
      models,
      messages: normalizedMessages,
      context,
      source,
      createdAt,
      updatedAt,
    };

    await setDoc(doc(firebaseDb, CHAT_COLLECTION, payload.id), payload, { merge: true });
    return payload;
  } catch {
    return null;
  }
};

export const listArchiveSessions = async (userId: string) => {
  try {
    const snapshot = await getDocs(query(collection(firebaseDb, CHAT_COLLECTION), where('userId', '==', userId)));
    return snapshot.docs
      .map((docSnap) => docSnap.data() as FirestoreArchiveSession)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [] as FirestoreArchiveSession[];
  }
};

export const getArchiveSession = async (userId: string, projectId: string) => {
  try {
    const snapshot = await getDoc(doc(firebaseDb, CHAT_COLLECTION, makeDocId(userId, projectId)));
    if (!snapshot.exists()) return null;
    return snapshot.data() as FirestoreArchiveSession;
  } catch {
    return null;
  }
};

export const deleteArchiveSessionsForUser = async (userId: string) => {
  try {
    const snapshot = await getDocs(query(collection(firebaseDb, CHAT_COLLECTION), where('userId', '==', userId)));
    await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
  } catch {
    // best-effort
  }
};

export const saveMascotSnapshot = async ({
  userId,
  name,
  isActive,
  config,
}: SaveMascotSnapshotInput) => {
  try {
    const createdAt = new Date().toISOString();
    const existing = await getDoc(doc(firebaseDb, MASCOT_COLLECTION, userId));
    const previous = existing.exists() ? (existing.data() as Partial<FirestoreMascotSnapshot>) : null;

    const payload: FirestoreMascotSnapshot = {
      id: userId,
      userId,
      name,
      isActive,
      config,
      createdAt: previous?.createdAt || createdAt,
      updatedAt: createdAt,
    };

    await setDoc(doc(firebaseDb, MASCOT_COLLECTION, userId), payload, { merge: true });
    return payload;
  } catch {
    return null;
  }
};

export const getLatestMascotSnapshot = async (userId: string) => {
  try {
    const snapshot = await getDoc(doc(firebaseDb, MASCOT_COLLECTION, userId));
    if (!snapshot.exists()) return null;
    return snapshot.data() as FirestoreMascotSnapshot;
  } catch {
    return null;
  }
};

export const deleteMascotSnapshotForUser = async (userId: string) => {
  try {
    await deleteDoc(doc(firebaseDb, MASCOT_COLLECTION, userId));
  } catch {
    // best-effort
  }
};
