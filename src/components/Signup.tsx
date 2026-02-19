import React, { useState } from 'react';
import { IonButton, IonInput, IonItem, IonLabel, useIonToast } from '@ionic/react';
import { usersApi } from '../api/services';

const SignUp: React.FC = () => {
  const [present] = useIonToast();
  const [fio, setFio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.create({ fio, email, password, role: 'client' });
      present({ message: 'Пользователь создан', duration: 1800, color: 'success', position: 'bottom' });
      setFio('');
      setEmail('');
      setPassword('');
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
    <form onSubmit={submit}>
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
      <IonButton expand="block" type="submit" className="ion-no-margin">
        Create account
      </IonButton>
    </form>
  );
};

export default SignUp;
