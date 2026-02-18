import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, firestoreBase } from '../firebase/Firebase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { UserRole } from '../models/Roles';
import { DEFAULT_ROLE } from '../models/Roles';

interface AuthContextValue {
  user: FirebaseUser | null;
  role: UserRole | null;
  loading: boolean;
  firestoreUserId: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  firestoreUserId: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreUserId, setFirestoreUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setFirestoreUserId(null);
        setLoading(false);
        return;
      }

      try {
        const usersColl = collection(firestoreBase, 'users');
        const q = query(usersColl, where('email', '==', u.email || ''));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docId = snap.docs[0].id;
          const data = snap.docs[0].data() as { role?: UserRole };
          setRole(data.role ?? DEFAULT_ROLE);
          setFirestoreUserId(docId);
        } else {
          // Bootstrap: если это известный админ, создаём запись и даём роль admin
          if ((u.email || '').toLowerCase() === 'admin@admin.ru') {
            const docRef = await addDoc(usersColl, {
              email: u.email,
              fio: 'Администратор',
              role: 'admin' as UserRole,
              uid: u.uid,
            });
            setRole('admin');
            setFirestoreUserId(docRef.id);
          } else {
            setRole(DEFAULT_ROLE);
            setFirestoreUserId(null);
          }
        }
      } catch {
        setRole(DEFAULT_ROLE);
        setFirestoreUserId(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={{ user, role, loading, firestoreUserId }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

