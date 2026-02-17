import React, { useEffect, useState } from 'react';
import { firestoreBase } from './Firebase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonTitle,
  IonLabel,
  IonChip,
  IonButton,
} from '@ionic/react';
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

  return (
    <IonGrid className="ion-padding">
      <IonRow>
        <IonCol>
          <IonTitle color="primary" className="ion-no-padding">
            ФИО
          </IonTitle>
        </IonCol>
        <IonCol>
          <IonTitle color="primary" className="ion-no-padding">
            Email
          </IonTitle>
        </IonCol>
        <IonCol>
          <IonTitle color="primary" className="ion-no-padding">
            Роль
          </IonTitle>
        </IonCol>
      </IonRow>
      {users.map((user) => (
        <IonRow key={user.uid}>
          <IonCol>
            <IonLabel>{user.fio ?? '—'}</IonLabel>
          </IonCol>
          <IonCol>
            <IonLabel>{user.email ?? '—'}</IonLabel>
          </IonCol>
          <IonCol>
            {user.role ? (
              <IonChip color="primary" outline>
                {ROLE_LABELS[user.role]}
              </IonChip>
            ) : (
              <IonLabel>—</IonLabel>
            )}
          </IonCol>
          <IonCol>
            {canManageUsers && (
              <IonButton
                size="small"
                color="danger"
                fill="clear"
                onClick={async () => {
                  if (!window.confirm(`Удалить пользователя ${user.email || user.fio || ''}?`)) return;
                  await deleteDoc(doc(firestoreBase, 'users', user.uid));
                  getUsers();
                }}
              >
                Удалить
              </IonButton>
            )}
          </IonCol>
        </IonRow>
      ))}
    </IonGrid>
  );
};

export default UserList;
