import 'firebase/auth';
import {addDoc, collection} from "firebase/firestore";
import React, {useState} from "react";
import {firestoreBase} from "./Firebase";
import {Location} from "../models/Location";
import {IonButton, IonInput, IonItem, IonList, IonTextarea, useIonToast} from "@ionic/react";

const LocationCreate: React.FC = () => {

    const [present] = useIonToast();

    const [address, setAddress] = useState('');
    const [entryPointsAmount, setEntryPointsAmount] = useState<number>(0)
    const [exitPointsAmount, setExitPointsAmount] = useState<number>(0)
    const [guardList, setGuardList] = useState<string>('')
    const [fio, setFio] = useState<string>('')
    const [state, setState] = useState<'active' | 'inactive' | 'emergency'>('active')

    const value = collection(firestoreBase, "objects")

    const presentToast = (position: 'top' | 'middle' | 'bottom' , text: string, color: 'danger' | 'primary' | 'success') => {
        present({
            message: text,
            duration: 1500,
            position,
            color
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const newLocation = new Location(address, entryPointsAmount, exitPointsAmount, guardList, fio, state);
            const docRef = await addDoc(value, {
                address,
                entryPointsAmount,
                exitPointsAmount,
                guardList,
                fio,
                state
            });
            presentToast("bottom", 'Form saved', 'success');
            console.log("Document written with ID: ", docRef.id);
            location.reload();
            reset();
        } catch (e) {
            presentToast("bottom", "Couldn't save form", 'danger');
            console.error("Error adding document: ", e);
        }
    }

    const reset = () => {
        setFio('');
        setEntryPointsAmount(0);
        setExitPointsAmount(0);
        setGuardList('')
        setAddress('');
    }

    const setInputFio = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setFio(value);
    }

    const setInputAddress = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setAddress(value);
    }

    const setInputEntryPointsAmount = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setEntryPointsAmount(Number(value));
    }

    const setInputExitPointsAmount = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setExitPointsAmount(Number(value));
    }

    const setInputGuardList = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setGuardList(value);
    }


    return (
        <form onSubmit={handleCreate}>
            <IonList>
                <IonItem>
                    <IonInput
                        label="Адрес объекта"
                        labelPlacement="floating"
                        placeholder=""
                        value={address}
                        onIonInput= {(event) => setInputAddress(event)}
                        required
                    >
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonInput
                        label="ФИО"
                        labelPlacement="floating"
                        placeholder=""
                        value={fio}
                        onIonInput= {(event) => setInputFio(event)}
                        required
                    >
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonInput
                        label="Количество входов"
                        labelPlacement="floating"
                        placeholder=""
                        type="number"
                        value={entryPointsAmount}
                        onIonInput= {(event) => setInputEntryPointsAmount(event)}
                        required
                    >
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonInput
                        label="Количество выходов"
                        labelPlacement="floating"
                        placeholder=""
                        type="number"
                        value={exitPointsAmount}
                        onIonInput= {(event) => setInputExitPointsAmount(event)}
                        required
                    >
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonInput
                        label="Список лиц"
                        labelPlacement="floating"
                        placeholder=""
                        value={guardList}
                        onIonInput= {(event) => setInputGuardList(event)}
                        required
                    ></IonInput>
                </IonItem>
            </IonList>
            <IonButton expand="block" type="submit">Создать</IonButton>
        </form>
    );
};


export default LocationCreate;
