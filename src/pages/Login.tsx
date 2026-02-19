import React, { useState } from 'react';
import { IonButton, IonCard, IonCardHeader, IonInput, IonItem, IonList, IonTitle, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [present] = useIonToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      history.replace('/projects');
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка входа',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonCard className="auth">
      <form className="ion-margin" onSubmit={signIn}>
        <IonCardHeader>
          <IonTitle color="primary" className="ion-text-center">
            CRM Строй
          </IonTitle>
        </IonCardHeader>
        <IonList>
          <IonItem>
            <IonInput
              type="email"
              label="Почта"
              labelPlacement="floating"
              value={email}
              onIonInput={(event) => setEmail(String(event.detail.value ?? ''))}
              required
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="Пароль"
              labelPlacement="floating"
              type="password"
              value={password}
              onIonInput={(event) => setPassword(String(event.detail.value ?? ''))}
              required
            />
          </IonItem>
        </IonList>
        <IonButton expand="block" type="submit" disabled={submitting}>
          {submitting ? 'Входим...' : 'Войти'}
        </IonButton>
      </form>
    </IonCard>
  );
};

export default Login;
