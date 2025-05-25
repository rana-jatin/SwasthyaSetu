
import { FileAnalysisResult } from './groqService';

export interface StoredFile {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
  uploadDate: Date;
  analysis?: string;
  extractedText?: string;
  metadata?: any;
}

class FileStorageService {
  private dbName = 'ChatbotFileStorage';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      console.log('Initializing IndexedDB for file storage');
      
      if (!window.indexedDB) {
        console.error('IndexedDB not supported');
        reject(new Error('IndexedDB not supported in this browser'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => {
        console.error('IndexedDB initialization error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        console.log('Upgrading IndexedDB schema');
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('uploadDate', 'uploadDate', { unique: false });
          console.log('Created files object store');
        }
      };
    });

    return this.initPromise;
  }

  async storeFile(file: StoredFile): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      console.log('Storing file:', file.name);
      
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.put(file);
      
      request.onerror = () => {
        console.error('Error storing file:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('File stored successfully');
        resolve();
      };
    });
  }

  async getFile(id: string): Promise<StoredFile | null> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllFiles(): Promise<StoredFile[]> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('Retrieved all files:', request.result.length);
        resolve(request.result);
      };
    });
  }

  async deleteFile(id: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('File deleted successfully');
        resolve();
      };
    });
  }
}

export const fileStorageService = new FileStorageService();
