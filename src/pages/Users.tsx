import {IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar} from '@ionic/react';
import '../styles/styles.css';
import React from "react";
import LogOut from "../components/LogOut";
import FabModal from "../components/FabModal";
import UserList from "../firebase/UserList";

const Users: React.FC = () => {
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
                    <UserList></UserList>
                    <FabModal></FabModal>
                </IonContent>
            </IonPage>
    );
};

export default Users;
