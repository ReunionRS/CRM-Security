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
  IonLabel,
  IonList,
  IonItem,
} from '@ionic/react';
import React from 'react';
import { documentTextOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import '../styles/styles.css';
import LogOut from '../components/LogOut';

const DOC_TYPES = [
  'Договор подряда',
  'Приложения к договору',
  'Смета',
  'Акты выполненных работ',
  'Чеки',
  'Гарантийные обязательства',
  'Проектная документация',
];

const Documents: React.FC = () => {
  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>CRM Строй — Документы</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Документооборот</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Поддерживаемые типы документов:</p>
            <IonList>
              {DOC_TYPES.map((name) => (
                <IonItem key={name}>
                  <IonIcon icon={documentTextOutline} slot="start" />
                  <IonLabel>{name}</IonLabel>
                </IonItem>
              ))}
            </IonList>
            <p className="ion-margin-top">
              Функции: хранение файлов, версионирование, доступ по ролям (клиент видит только свои документы).
              Загрузка документов будет привязана к объекту строительства.
            </p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Documents;
