import React, { useEffect, useState } from 'react';
import { IonButton, IonCard, IonCardHeader, IonCheckbox, IonInput, IonItem, IonLabel, IonList, IonTitle, useIonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import { useAuth } from '../context/AuthContext';

const SAVED_LOGIN_KEY = 'crm_saved_login';
const REMEMBER_LOGIN_KEY = 'crm_remember_login';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [present] = useIonToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const remember = localStorage.getItem(REMEMBER_LOGIN_KEY) === '1';
    setRememberLogin(remember);
    if (!remember) return;
    const raw = localStorage.getItem(SAVED_LOGIN_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { email?: string; password?: string };
      setEmail(parsed.email || '');
      setPassword(parsed.password || '');
    } catch {
      localStorage.removeItem(SAVED_LOGIN_KEY);
    }
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      if (rememberLogin) {
        localStorage.setItem(REMEMBER_LOGIN_KEY, '1');
        localStorage.setItem(SAVED_LOGIN_KEY, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(REMEMBER_LOGIN_KEY);
        localStorage.removeItem(SAVED_LOGIN_KEY);
      }
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
          <IonItem lines="none">
            <IonCheckbox
              slot="start"
              checked={rememberLogin}
              onIonChange={(event) => setRememberLogin(Boolean(event.detail.checked))}
            />
            <IonLabel>Запомнить данные для входа</IonLabel>
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
