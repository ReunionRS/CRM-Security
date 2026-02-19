import { IonButton, IonButtons, IonIcon } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import React from 'react';
import { useHistory } from 'react-router';
import { useAuth } from '../context/AuthContext';

const LogOut: React.FC = () => {
  const history = useHistory();
  const { logout } = useAuth();

  const userSignOut = () => {
    logout();
    history.replace('/login');
  };

  return (
    <IonButtons className="logout-buttons ion-margin-end" slot="end">
      <IonButton fill="solid" onClick={userSignOut} className="logout-button">
        <span>Выход</span>
        <IonIcon slot="end" icon={logOutOutline} />
      </IonButton>
    </IonButtons>
  );
};

export default LogOut;
