import 'firebase/auth';
import {addDoc, collection} from "firebase/firestore";
import React, {useState} from "react";
import {firestoreBase} from "./Firebase";
import {Form} from "../models/Form";
import {IonButton, IonInput, IonItem, IonList, IonTextarea, useIonToast} from "@ionic/react";

const FormCreate: React.FC = () => {

    const [present] = useIonToast();
    const [fio, setFio] = useState<string>('')
    const [passport, setPassport] = useState<string>('')
    const [address, setAddress] = useState<string>('')
    const [fioAddress, setFioAddress] = useState<string>('')
    const [note, setNote] = useState<string>('')
    const [price, setPrice] = useState<number>(0)

    const value = collection(firestoreBase, "forms")

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
            const newForm = new Form(address, passport, fioAddress, fio, note, price);
            const docRef = await addDoc(value, {
                address: newForm.address,
                passport: newForm.passport,
                fioAddress: newForm.fioAddress,
                fio: newForm.fio,
                note: newForm.note,
                price: newForm.price,
                state: 'open'
            });
            presentToast("bottom", 'Form saved', 'success');
            console.log("Document written with ID: ", docRef.id);
            reset();
            location.reload();
        } catch (e) {
            presentToast("bottom", "Couldn't save form", 'danger');
            console.error("Error adding document: ", e);
        }
    }

    const reset = () => {
        setFio('');
        setFioAddress('');
        setPassport('');
        setAddress('');
        setNote('');
        setPrice(0)
    }

    const setInputFio = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setFio(value);
    }
    const setInputFioAddress = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setFioAddress(value);
    };

    const setInputPassport = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setPassport(value);
    };

    const setInputAddress = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setAddress(value);
    };

    const setInputNote = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setNote(value);
    };

    const setInputPrice = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        setPrice(Number(value));
    };

    return (
        <form onSubmit={handleCreate}>
            <IonList>
                <IonItem>
                    <IonInput
                        label="ФИО Клиента"
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
                        label="Адрес ФИО"
                        labelPlacement="floating"
                        placeholder=""
                        value={fioAddress}
                        onIonInput= {(event) => setInputFioAddress(event)}
                        required
                    >
                    </IonInput>
                </IonItem>
                <IonItem>
                    <IonInput
                        label="Данные паспорта"
                        labelPlacement="floating"
                        placeholder=""
                        value={passport}
                        onIonInput= {(event) => setInputPassport(event)}
                        required
                    >
                    </IonInput>
                </IonItem>
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
                    <IonTextarea
                        label="Комментарий"
                        placeholder=""
                        value={note}
                        onIonInput= {(event) => setInputNote(event)}
                        required
                    >
                    </IonTextarea>
                </IonItem>
                <IonItem>
                    <IonInput
                        label="Цена"
                        type="number"
                        labelPlacement="floating"
                        placeholder=""
                        value={price}
                        onIonInput= {(event) => setInputPrice(event)}
                        required
                    ></IonInput>
                </IonItem>
            </IonList>
            <IonButton expand="block" type="submit">Создать</IonButton>
        </form>
    );
};


export default FormCreate;
