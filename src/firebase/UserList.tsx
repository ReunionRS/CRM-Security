import React, { useEffect, useState } from 'react';
import { firestoreBase } from './Firebase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { IonButton, IonIcon, IonChip } from '@ionic/react';
import { trash } from 'ionicons/icons';
import type { UserRole } from '../models/Roles';
import { ROLE_LABELS } from '../models/Roles';
import { useAuth } from '../context/AuthContext';

interface UserRecord {
  uid: string;
  fio?: string;
  email?: string;
  role?: UserRole;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const value = collection(firestoreBase, 'users');
  const { role } = useAuth();

  const canManageUsers = role === 'admin' || role === 'director';

  const getUsers = async () => {
    const snap = await getDocs(value);
    setUsers(snap.docs.map((d) => ({ ...d.data(), uid: d.id } as UserRecord)));
  };

  useEffect(() => {
    getUsers();
  }, []);

  if (users.length === 0) {
    return (
      <div className="no-users">
        <p>Нет пользователей в системе</p>
      </div>
    );
  }

  return (
    <div className="user-cards-grid">
      {users.map((user) => (
        <div key={user.uid} className="user-card">
          <div className="user-card-header">
            <p className="user-card-name">{user.fio ?? 'Без имени'}</p>
            <p className="user-card-email">{user.email ?? '—'}</p>
          </div>
          {user.role && (
            <IonChip color="primary" outline className="user-card-role">
              {ROLE_LABELS[user.role]}
            </IonChip>
          )}
          {canManageUsers && (
            <div className="user-card-actions">
              <IonButton
                size="small"
                color="danger"
                fill="outline"
                onClick={async () => {
                  if (!window.confirm(`Удалить пользователя ${user.email || user.fio || ''}?`))
                    return;
                  await deleteDoc(doc(firestoreBase, 'users', user.uid));
                  getUsers();
                }}
              >
                <IonIcon slot="icon-only" icon={trash} />
              </IonButton>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserList;
