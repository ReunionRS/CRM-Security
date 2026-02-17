import {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar
} from "@ionic/react";
import {addOutline} from "ionicons/icons";
import React, {useState} from "react";
import UserCreate from "../firebase/UserCreate";
import ProjectCreate from "../firebase/ProjectCreate";


const FabModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <IonModal isOpen={isOpen}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Создать</IonTitle>
                        <IonButtons slot="end">
                            <IonButton color="danger" onClick={() => setIsOpen(false)}>Закрыть</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {(() => {
                        if (window.location.pathname === '/projects') {
                            return <ProjectCreate />;
                        }
                        if (window.location.pathname === '/users') {
                            return <UserCreate />;
                        }
                        return null;
                    })()}
                </IonContent>
            </IonModal>
            {(['/projects', '/users'].includes(window.location.pathname)) && (
                <IonFab slot="fixed" vertical="bottom" horizontal="end">
                    <IonFabButton onClick={() => setIsOpen(true)}>
                        <IonIcon icon={addOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
            )}
        </>
    );
};

export default FabModal;
