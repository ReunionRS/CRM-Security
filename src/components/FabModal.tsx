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
import FormCreate from "../firebase/FormCreate";
import LocationCreate from "../firebase/LocationCreate";
import SignUp from "./Signup";
import UserCreate from "../firebase/UserCreate";


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
                        if (window.location.pathname == '/forms') {
                            return (
                                <FormCreate></FormCreate>
                            )
                        } else if (window.location.pathname == '/monitoring') {
                            return (
                                <LocationCreate></LocationCreate>
                            )
                        } else {
                            return (
                                <UserCreate></UserCreate>
                            )
                        }
                    })()}
                </IonContent>
            </IonModal>
            <IonFab slot="fixed" vertical="bottom" horizontal="end">
                <IonFabButton onClick={() => setIsOpen(true)}>
                    <IonIcon icon={addOutline}></IonIcon>
                </IonFabButton>
            </IonFab>
        </>
    );
};

export default FabModal;
