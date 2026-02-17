import { createUserWithEmailAndPassword } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import React, { useState } from 'react';
import { auth, firestoreBase } from './Firebase';
import { User } from '../models/User';
import { IonButton, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, useIonToast } from '@ionic/react';
import { ROLE_LABELS, type UserRole } from '../models/Roles';

const UserCreate: React.FC = () => {
  const usersColl = collection(firestoreBase, 'users');

  const [present] = useIonToast();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fio, setFio] = useState<string>('');
  const [role, setRole] = useState<UserRole>('manager');

  const presentToast = (
    position: 'top' | 'middle' | 'bottom',
    text: string,
    color: 'danger' | 'primary' | 'success'
  ) => {
    present({
      message: text,
      duration: 1500,
      position,
      color,
    });
  };

  const SignUp = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password)
      .then(async () => {
        try {
          const newUser = new User(fio, email, role);
          const docRef = await addDoc(usersColl, {
            email: newUser.email,
            fio: newUser.fio,
            role: newUser.role,
          });
          presentToast('bottom', 'Пользователь создан', 'success');
          console.log('User created with ID: ', docRef.id);
          location.reload();
        } catch (err) {
          console.error('Error adding document: ', err);
          presentToast('bottom', 'Ошибка сохранения пользователя', 'danger');
        }
      })
      .catch(() => {
        presentToast('bottom', 'Не удалось создать пользователя', 'danger');
      });
  };

  const setInputFio = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    setFio(value);
  };
  const setInputPassword = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    setPassword(value);
  };
  const setInputEmail = (ev: Event) => {
    const value = (ev.target as HTMLInputElement).value;
    setEmail(value);
  };

  return (
    <form onSubmit={SignUp}>
      <IonItem>
        <IonLabel position="floating">ФИО</IonLabel>
        <IonInput value={fio} onIonInput={(event) => setInputFio(event)} required />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Email</IonLabel>
        <IonInput type="email" value={email} onIonInput={(event) => setInputEmail(event)} required />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Пароль</IonLabel>
        <IonInput
          type="password"
          value={password}
          onIonInput={(event) => setInputPassword(event)}
          required
        />
      </IonItem>
      <IonItem>
        <IonLabel position="floating">Роль</IonLabel>
        <IonSelect
          value={role}
          onIonChange={(e) => setRole(e.detail.value as UserRole)}
          interface="popover"
        >
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
