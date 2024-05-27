import {IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar} from '@ionic/react';
import '../styles/styles.css';
import React from "react";
import logo from "../img/svg/logo.svg"
import FormList from "../firebase/FormList";
import LogOut from "../components/LogOut";
import FabModal from "../components/FabModal";

const Forms: React.FC = () => {
    return (
            <IonPage id="main-content">
                <IonContent fullscreen>
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonMenuButton></IonMenuButton>
                            </IonButtons>
                            <div className="logo-title">
                                <img src={logo}></img>
                                <IonTitle>CRM-Security</IonTitle>
                            </div>
                            <LogOut></LogOut>
                        </IonToolbar>
                    </IonHeader>
                    <FormList></FormList>
                    <FabModal></FabModal>
                </IonContent>
            </IonPage>
    );
};

export default Forms;
