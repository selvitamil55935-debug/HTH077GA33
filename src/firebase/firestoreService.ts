import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import { Transaction, Budget, AnalysisReport } from '../types';

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  sources?: { title: string; uri?: string }[];
}

/**
 * Save or sync user profile in Firestore
 */
export async function syncUserProfile(userId: string, data: { name?: string; email?: string; mode?: string; currency?: string }) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Could not sync user profile to Firestore (offline/guest mode):', error);
  }
}

/**
 * Subscribe to real-time transactions for a user
 */
export function subscribeUserTransactions(
  userId: string,
  onUpdate: (transactions: Transaction[]) => void
) {
  try {
    const txCol = collection(db, 'users', userId, 'transactions');
    const q = query(txCol, orderBy('date', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          txs.push(docSnap.data() as Transaction);
        });
        onUpdate(txs);
      },
      (err) => {
        console.warn('Firestore transaction listener fallback:', err);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to transactions:', err);
    return () => {};
  }
}

/**
 * Save a single transaction to Firestore
 */
export async function saveTransactionToFirestore(userId: string, tx: Transaction) {
  try {
    const txRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(txRef, tx);
  } catch (err) {
    console.warn('Could not persist transaction to Firestore:', err);
  }
}

/**
 * Save batch transactions to Firestore
 */
export async function saveBatchTransactionsToFirestore(userId: string, txs: Transaction[]) {
  try {
    await Promise.all(
      txs.map((tx) => {
        const txRef = doc(db, 'users', userId, 'transactions', tx.id);
        return setDoc(txRef, tx);
      })
    );
  } catch (err) {
    console.warn('Could not persist batch to Firestore:', err);
  }
}

/**
 * Delete a transaction from Firestore
 */
export async function deleteTransactionFromFirestore(userId: string, txId: string) {
  try {
    const txRef = doc(db, 'users', userId, 'transactions', txId);
    await deleteDoc(txRef);
  } catch (err) {
    console.warn('Could not delete transaction from Firestore:', err);
  }
}

/**
 * Save budget limit to Firestore
 */
export async function saveBudgetToFirestore(userId: string, budget: Budget) {
  try {
    const budgetRef = doc(db, 'users', userId, 'budgets', budget.id);
    await setDoc(budgetRef, budget);
  } catch (err) {
    console.warn('Could not save budget to Firestore:', err);
  }
}

/**
 * Subscribe to budgets for a user
 */
export function subscribeUserBudgets(userId: string, onUpdate: (budgets: Budget[]) => void) {
  try {
    const bCol = collection(db, 'users', userId, 'budgets');
    return onSnapshot(
      bCol,
      (snapshot) => {
        const budgets: Budget[] = [];
        snapshot.forEach((docSnap) => {
          budgets.push(docSnap.data() as Budget);
        });
        if (budgets.length > 0) {
          onUpdate(budgets);
        }
      },
      (err) => {
        console.warn('Firestore budgets listener fallback:', err);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to budgets:', err);
    return () => {};
  }
}

/**
 * Save chat message to Firestore
 */
export async function saveChatMessageToFirestore(userId: string, msg: StoredChatMessage) {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', msg.id);
    await setDoc(chatRef, msg);
  } catch (err) {
    console.warn('Could not persist chat message to Firestore:', err);
  }
}

/**
 * Load initial chat thread messages from Firestore
 */
export async function loadChatMessagesFromFirestore(userId: string): Promise<StoredChatMessage[]> {
  try {
    const chatCol = collection(db, 'users', userId, 'chats');
    const q = query(chatCol, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    const msgs: StoredChatMessage[] = [];
    snapshot.forEach((docSnap) => {
      msgs.push(docSnap.data() as StoredChatMessage);
    });
    return msgs;
  } catch (err) {
    console.warn('Could not load chat messages from Firestore:', err);
    return [];
  }
}
