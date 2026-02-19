import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import React from 'react';
import { barChartOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import '../styles/styles.css';
import LogOut from '../components/LogOut';

const Reports: React.FC = () => {
  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>CRM Строй — Отчёты</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={barChartOutline} className="ion-margin-end" />
              Отчёты о проделанных работах
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Планируемые отчёты:</p>
            <ul>
              <li>Автоматический отчёт по этапам</li>
              <li>Процент готовности объекта</li>
              <li>Диаграмма прогресса (Gantt)</li>
              <li>Отчёт по отклонению сроков</li>
              <li>История изменений</li>
            </ul>
            <p className="ion-margin-top">Модуль отчётов будет доступен в следующей версии.</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Reports;
