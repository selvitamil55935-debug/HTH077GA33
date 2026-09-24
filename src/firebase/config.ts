import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Configuration loaded from provisioned firebase-applet-config.json
const firebaseConfig = {
  projectId: 'noted-quill-hdw25',
  appId: '1:500338883489:web:772969edeed36153b969e0',
  apiKey: 'AIzaSyAiYU4btCEta1GgjBcD50AbzQblv3DYfmw',
  authDomain: 'noted-quill-hdw25.firebaseapp.com',
  storageBucket: 'noted-quill-hdw25.firebasestorage.app',
  messagingSenderId: '500338883489',
};

const DATABASE_ID = 'ai-studio-evidencebasedper-87f32d76-303f-47c9-b71b-0a082bc1e0c4';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, DATABASE_ID);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Initial boot connection test
testConnection();
