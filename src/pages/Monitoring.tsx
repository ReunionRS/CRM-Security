import {IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar} from '@ionic/react';
import '../styles/styles.css';
import React from "react";
import LogOut from "../components/LogOut";
import FabModal from "../components/FabModal";
import LocationList from "../firebase/LocationList";

const Monitoring: React.FC = () => {
    return (
            <IonPage id="main-content">
                <IonContent fullscreen>
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonMenuButton></IonMenuButton>
                            </IonButtons>
                            <IonTitle>CRM-Security</IonTitle>
                            <LogOut></LogOut>
                        </IonToolbar>
                    </IonHeader>
                    <LocationList></LocationList>
                    <FabModal></FabModal>
                </IonContent>
            </IonPage>
    );
};

export default Monitoring;
