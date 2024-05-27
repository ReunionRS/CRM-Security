import React, {useState} from 'react';
import {signInWithEmailAndPassword} from "firebase/auth";
import 'firebase/firestore';
import {auth} from "../firebase/Firebase"
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import {IonButton, IonCard, IonCardHeader, IonInput, IonItem, IonList, IonTitle} from "@ionic/react";
import {useHistory} from "react-router";


const Login = () => {

    const history = useHistory();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')
    const SignIn = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log(userCredential);
                history.push('/monitoring');
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const setInputEmail = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setEmail(value);
    }
    const setInputPassword = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setPassword(value);
    }

    return (
        <IonCard className="auth">
            <form className="ion-margin" onSubmit={SignIn}>
                <IonCardHeader>
                    <IonTitle color="primary" className="ion-text-center">CRM-Security</IonTitle>
                </IonCardHeader>
                <IonList>
                    <IonItem>
                        <IonInput
                            type="email"
                            label="Почта"
                            labelPlacement="floating"
                            placeholder=""
                            value={email}
                            onIonInput={(event) => setInputEmail(event)}
                            required
                        ></IonInput>
                    </IonItem>
                    <IonItem>
                        <IonInput
                            label="Пароль"
                            labelPlacement="floating"
                            placeholder=""
                            type="password"
                            value={password}
                            onIonInput={(event) => setInputPassword(event)}
                            required
                        ></IonInput>
                    </IonItem>
                </IonList>
                <IonButton expand="block" type="submit">Войти</IonButton>
            </form>
        </IonCard>
    );
}

export default Login;
