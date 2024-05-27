import {IonButton, IonButtons, IonIcon} from "@ionic/react";
import {logOutOutline} from "ionicons/icons";
import React, {useEffect, useState} from "react";
import {onAuthStateChanged, signOut} from "firebase/auth";
import {auth} from "../firebase/Firebase";
import {useHistory} from "react-router";



const LogOut: React.FC = () => {

    const [authUser, setAuthUser] = useState(null);

    const history = useHistory();

    useEffect(() => {
        const listen = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthUser(user);
            } else {
                setAuthUser(null);
                history.push("/login");
                location.reload();
            }
        });

        return () => {
            listen();
        };
    }, []);

    const userSignOut = () => {
        signOut(auth)
            .then(() => {
                console.log("sign out successful");
                history.push("/login");
                location.reload();
            })
            .catch((error) => console.log(error));
    };

    return (
        <IonButtons className="ion-margin-end" slot="end">
            <IonButton color="danger" fill="solid" onClick={userSignOut}>
                Выход
                <IonIcon slot="end" icon={logOutOutline}></IonIcon>
            </IonButton>
        </IonButtons>
    );
};

export default LogOut;
