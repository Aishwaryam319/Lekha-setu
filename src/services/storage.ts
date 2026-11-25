import { ChatMessage, DocumentRecord, NotificationItem, UserPreferences } from '../types';

const DB_NAME = 'lekhasetu_db';
const DB_VERSION = 1;
const STORE_DOCUMENTS = 'documents';
const STORE_NOTIFICATIONS = 'notifications';
const STORE_CHAT = 'chatHistory';
const PREFS_KEY = 'lekhasetu_user_preferences_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  sidebarCollapsed: false,
  compactTables: false,
  officerProfile: {
    name: 'Siddharth Rao',
    designation: 'Case Worker / Revenue Inspector',
    employeeId: 'KA-GOV-4082',
  },
  activeSelection: {
    departmentId: 'tahsildar_office',
    districtId: 'mysuru',
    talukId: 'mysuru_mysuru',
    officeId: 'tahsildar_mysuru_mysuru',
    officeNameEn: 'Office of the Tahsildar, Mysuru',
    officeNameKn: 'ತಹಶೀಲ್ದಾರ್ ಕಚೇರಿ, ಮೈಸೂರು',
    customOfficeName: '',
  },
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      officerProfile: {
        ...DEFAULT_PREFERENCES.officerProfile,
        ...(parsed.officerProfile || {}),
      },
      activeSelection: {
        ...DEFAULT_PREFERENCES.activeSelection,
        ...(parsed.activeSelection || {}),
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences to localStorage:', err);
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('uploadDate', 'uploadDate', { unique: false });
        docStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_NOTIFICATIONS)) {
        const notifStore = db.createObjectStore(STORE_NOTIFICATIONS, { keyPath: 'id' });
        notifStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CHAT)) {
        db.createObjectStore(STORE_CHAT, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function putInStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export const dbService = {
  async checkConnection(): Promise<boolean> {
    try {
      const db = await openDatabase();
      db.close();
      return true;
    } catch {
      return false;
    }
  },

  async getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        return {
          usage: est.usage || 0,
          quota: est.quota || 0,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  async getAllDocuments(): Promise<DocumentRecord[]> {
    const docs = await getAllFromStore<DocumentRecord>(STORE_DOCUMENTS);
    return docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  },

  async saveDocument(doc: DocumentRecord): Promise<void> {
    await putInStore(STORE_DOCUMENTS, doc);
  },

  async deleteDocument(id: string): Promise<void> {
    await deleteFromStore(STORE_DOCUMENTS, id);
  },

  async clearDocuments(): Promise<void> {
    await clearStore(STORE_DOCUMENTS);
  },

  async getAllNotifications(): Promise<NotificationItem[]> {
    const list = await getAllFromStore<NotificationItem>(STORE_NOTIFICATIONS);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveNotification(item: NotificationItem): Promise<void> {
    await putInStore(STORE_NOTIFICATIONS, item);
  },

  async clearNotifications(): Promise<void> {
    await clearStore(STORE_NOTIFICATIONS);
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const msgs = await getAllFromStore<ChatMessage>(STORE_CHAT);
    return msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async saveChatMessage(msg: ChatMessage): Promise<void> {
    await putInStore(STORE_CHAT, msg);
  },

  async clearChatHistory(): Promise<void> {
    await clearStore(STORE_CHAT);
  },
};
