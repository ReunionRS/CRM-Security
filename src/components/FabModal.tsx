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
import { useAuth } from "../context/AuthContext";


const FabModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { role, loading } = useAuth();
    const canManageUsers = loading || role === 'admin' || role === 'director';
    const canCreateProjects = loading || role === 'admin' || role === 'director' || role === 'manager' || role === 'foreman';
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
                            return canCreateProjects ? (
                                <ProjectCreate />
                            ) : (
                                <div className="ion-text-center ion-padding">
                                    Нет доступа к созданию объектов.
                                </div>
                            );
                        }
                        if (window.location.pathname === '/users') {
                            return canManageUsers ? (
                                <UserCreate />
                            ) : (
                                <div className="ion-text-center ion-padding">
                                    Нет доступа к созданию пользователей.
                                </div>
                            );
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
