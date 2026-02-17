import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React from 'react';
import '../styles/styles.css';
import LogOut from '../components/LogOut';
import FabModal from '../components/FabModal';
import ProjectList from '../firebase/ProjectList';

const Projects: React.FC = () => {
  return (
    <IonPage id="main-content">
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>CRM Строй — Объекты</IonTitle>
            <LogOut />
          </IonToolbar>
        </IonHeader>
        <ProjectList />
        <FabModal />
      </IonContent>
    </IonPage>
  );
};

export default Projects;
