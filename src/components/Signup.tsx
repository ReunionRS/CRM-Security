import React, {useState} from 'react';
import {createUserWithEmailAndPassword} from "firebase/auth";
import 'firebase/firestore';
import {auth} from "../firebase/Firebase"
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import {IonButton, IonInput, IonItem, IonLabel} from '@ionic/react';


const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const SignUp = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('User created');
                location.reload();
            })
            .catch((error) => {
                console.log("Couldn't create User");
            });
    };

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
                <IonLabel position="floating">Email</IonLabel>
                <IonInput
                    type="email"
                    value={email}
                    onIonInput={(event) => setInputEmail(event)}>
                    required
                </IonInput>
            </IonItem>
            <IonItem>
                <IonLabel position="floating">Email</IonLabel>
                <IonInput
                    type="email"
                    value={email}
                    onIonInput={(event) => setInputEmail(event)}></IonInput>
                required
            </IonItem>
            <IonItem>
                <IonLabel position="floating">Пароль</IonLabel>
                <IonInput
                    type="password"
                    value={password}
                    onIonInput={(event) => setInputPassword(event)}>
                    required
                </IonInput>
            </IonItem>
            <IonButton expand="block" type="submit" className="ion-no-margin">Create account</IonButton>
        </form>
    );
}

export default SignUp;
