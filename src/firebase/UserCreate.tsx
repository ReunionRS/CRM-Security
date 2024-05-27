import {createUserWithEmailAndPassword} from 'firebase/auth';
import {addDoc, collection} from "firebase/firestore";
import React, {useState} from "react";
import {auth, firestoreBase} from "./Firebase";
import {User} from "../models/User";

import {IonButton, IonInput, IonItem, IonLabel, useIonToast} from "@ionic/react";

const FormCreate: React.FC = () => {

    const value = collection(firestoreBase, "users")

    const [present] = useIonToast();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [fio, setFio] = useState<string>('')

    const presentToast = (position: 'top' | 'middle' | 'bottom', text: string, color: 'danger' | 'primary' | 'success') => {
        present({
            message: text,
            duration: 1500,
            position,
            color
        });
    };

    const SignUp = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                console.log('User created');
                e.preventDefault();
                try {
                    const newUser = new User(fio, email);
                    const docRef = await addDoc(value, {
                        email: newUser.email,
                        fio: newUser.fio
                    });
                    presentToast("bottom", 'User created', 'success');
                    console.log("User created with ID: ", docRef.id);
                    location.reload();
                } catch (e) {
                    console.error("Error adding document: ", e);
                }
            })
            .catch((error) => {
                presentToast("bottom", "User couldn't be created", 'danger');
                console.log("Couldn't create User");
            });
    };

    const setInputFio = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setFio(value);
    }
    const setInputPassword = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setPassword(value);
    }
    const setInputEmail = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setEmail(value);
    };
    return (
        <form onSubmit={SignUp}>
            <IonItem>
                <IonLabel position="floating">ФИО</IonLabel>
                <IonInput
                    value={fio}
                    onIonInput={(event) => setInputFio(event)}
                    required
                >
                </IonInput>
            </IonItem>
            <IonItem>
                <IonLabel position="floating">Email</IonLabel>
                <IonInput
                    type="email"
                    value={email}
                    onIonInput={(event) => setInputEmail(event)}
                    required
                ></IonInput>
            </IonItem>
            <IonItem>
                <IonLabel position="floating">Пароль</IonLabel>
                <IonInput
                    type="password"
                    value={password}
                    onIonInput={(event) => setInputPassword(event)}
                    required
                >
                </IonInput>
            </IonItem>
            <IonButton expand="block" type="submit" className="ion-no-margin">Create account</IonButton>
        </form>
    );
};


export default FormCreate;
