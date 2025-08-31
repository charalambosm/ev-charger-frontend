// src/services/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
  Query,
  DocumentReference,
  CollectionReference,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Generic types for Firestore operations
export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface QueryOptions {
  where?: Array<{ field: string; operator: any; value: any }>;
  orderBy?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

// Collection references
export const collections = {
  users: 'users',
  chargingStations: 'chargingStations',
  userPreferences: 'userPreferences',
} as const;

// Generic CRUD operations
export class FirestoreService {
  // Get a single document by ID
  static async getDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  // Get all documents from a collection
  static async getDocuments<T extends FirestoreDocument>(
    collectionName: string,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      let q: Query<DocumentData> = collection(db, collectionName);
      
      // Apply where clauses
      if (options?.where) {
        options.where.forEach(({ field, operator, value }) => {
          q = query(q, where(field, operator, value));
        });
      }
      
      // Apply ordering
      if (options?.orderBy) {
        options.orderBy.forEach(({ field, direction = 'asc' }) => {
          q = query(q, orderBy(field, direction));
        });
      }
      
      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }
      
      // Apply startAfter for pagination
      if (options?.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Add a new document
  static async addDocument<T extends Omit<FirestoreDocument, 'id'>>(
    collectionName: string,
    data: T
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  // Set a document with a specific ID (create or overwrite)
  static async setDocument<T extends Omit<FirestoreDocument, 'id'>>(
    collectionName: string,
    documentId: string,
    data: T
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  }

  // Update an existing document
  static async updateDocument(
    collectionName: string,
    documentId: string,
    data: Partial<FirestoreDocument>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Delete a document
  static async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Get a document reference
  static getDocumentRef(collectionName: string, documentId: string): DocumentReference {
    return doc(db, collectionName, documentId);
  }

  // Get a collection reference
  static getCollectionRef(collectionName: string): CollectionReference {
    return collection(db, collectionName);
  }

  // Listen to real-time updates for a single document
  static subscribeToDocument<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string,
    callback: (data: T | null) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, documentId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as T);
      } else {
        callback(null);
      }
    });
  }

  // Listen to real-time updates for a collection
  static subscribeToCollection<T extends FirestoreDocument>(
    collectionName: string,
    callback: (data: T[]) => void,
    options?: QueryOptions
  ): Unsubscribe {
    let q: Query<DocumentData> = collection(db, collectionName);
    
    // Apply where clauses
    if (options?.where) {
      options.where.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });
    }
    
    // Apply ordering
    if (options?.orderBy) {
      options.orderBy.forEach(({ field, direction = 'asc' }) => {
        q = query(q, orderBy(field, direction));
      });
    }
    
    // Apply limit
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      callback(documents);
    });
  }

  // Batch write operations
  static async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    id: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(({ type, collection: collectionName, id, data }) => {
        const docRef = doc(db, collectionName, id);
        
        switch (type) {
          case 'set':
            batch.set(docRef, data);
            break;
          case 'update':
            batch.update(docRef, data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }

  // Run a transaction
  static async runTransaction<T>(
    updateFunction: (transaction: any) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(db, updateFunction);
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  }

  // Utility function to convert Firestore Timestamp to Date
  static timestampToDate(timestamp: Timestamp | null | undefined): Date | null {
    if (!timestamp) return null;
    return timestamp.toDate();
  }

  // Utility function to convert Date to Firestore Timestamp
  static dateToTimestamp(date: Date | null | undefined): Timestamp | null {
    if (!date) return null;
    return Timestamp.fromDate(date);
  }
}

// Export the service instance
export default FirestoreService;
