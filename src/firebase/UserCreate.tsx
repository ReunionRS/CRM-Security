import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, useIonToast } from '@ionic/react';
import { usersApi } from '../api/services';
import { ROLE_LABELS, type UserRole } from '../models/Roles';

const UserCreate: React.FC = () => {
  const [present] = useIonToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fio, setFio] = useState('');
  const [role, setRole] = useState<UserRole>('manager');

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.create({ fio, email, password, role });
      present({ message: 'Пользователь создан', duration: 1800, color: 'success', position: 'bottom' });
      setEmail('');
      setPassword('');
      setFio('');
      setRole('manager');
      location.reload();
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Не удалось создать пользователя',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    }
  };

  return (
    <form onSubmit={signUp}>
      <IonItem>
        <IonLabel position="floating">ФИО</IonLabel>
        <IonInput value={fio} onIonInput={(event) => setFio(String(event.detail.value ?? ''))} required />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Email</IonLabel>
        <IonInput type="email" value={email} onIonInput={(event) => setEmail(String(event.detail.value ?? ''))} required />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Пароль</IonLabel>
        <IonInput type="password" value={password} onIonInput={(event) => setPassword(String(event.detail.value ?? ''))} required />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Роль</IonLabel>
        <IonSelect value={role} onIonChange={(e) => setRole(e.detail.value as UserRole)} interface="popover">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <IonSelectOption key={key} value={key}>
              {label}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
      <IonButton expand="block" type="submit" className="ion-no-margin">
        Создать пользователя
      </IonButton>
    </form>
  );
};

export default UserCreate;
