import React, {useEffect, useState} from "react";
import {firestoreBase} from './Firebase';
import {collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";
import 'firebase/auth';
import {IonButton, IonButtons, IonChip, IonCol, IonGrid, IonInput, IonRow, IonTextarea} from "@ionic/react";


const FormList: React.FC = () => {

    const [forms, setForms] = useState([])


    const value = collection(firestoreBase, "forms")

    const getData = async () => {
        const dbForms = await getDocs(value)
        setForms(dbForms.docs.map(doc => ({...doc.data(), uid: doc.id})))
    }

    useEffect(() => {
        getData();
    }, []);

    const handleDelete = async (uid: number) => {
        const deleteVal = doc(firestoreBase, "forms/" + uid.toString())
        await deleteDoc(deleteVal);
        location.reload();
    }

    const handleClose = async (uid: string) => {
        const updateVal = doc(firestoreBase, "forms/" + uid)
        await updateDoc(updateVal, {state: 'closed'});
        location.reload();
    }

    const handleSave = async (uid: number, address: string, passport: string, fioAddress: string, fio: string, note:string, price: number) => {
        const updateVal = doc(firestoreBase, "forms/" + uid)
        await updateDoc(updateVal, {
            address: address,
            passport: passport,
            fioAddress: fioAddress,
            fio: fio,
            note: note,
            price: price
        });
        location.reload();
    }

    return (
        <IonGrid>
            <IonRow>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Адрес объекта</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Данные паспорта</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Адрес ФИО</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">ФИО Клиента</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Комментарий</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Цена</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Статус</ion-title>
                </IonCol>
                <IonCol>
                    <ion-title color="primary" class="ion-no-padding">Действие</ion-title>
                </IonCol>
            </IonRow>
            {
                forms.map(form =>
                    <IonRow key={form.uid}>
                        <IonCol>
                            <IonInput
                                value={form.address}
                                onIonInput={(event) => {
                                    form.address = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </IonCol>
                        <IonCol>
                            <IonInput
                                value={form.passport}
                                onIonInput={(event) => {
                                    form.passport = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </IonCol>
                        <IonCol>
                            <IonInput
                                value={form.fioAddress}
                                onIonInput={(event) => {
                                    form.fioAddress = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </IonCol>
                        <IonCol>
                            <IonInput
                                value={form.fio}
                                onIonInput={(event) => {
                                    form.fio = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </IonCol>
                        <IonCol>
                            <IonTextarea
                                value={form.note}
                                onIonInput={(event) => {
                                    form.note = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonTextarea>
                        </IonCol>
                        <IonCol>
                            <IonInput
                                value={form.price}
                                type="number"
                                onIonInput={(event) => {
                                    form.price = (event.target as HTMLInputElement).value;
                                }}
                                required>
                            </IonInput>
                        </IonCol>
                        <IonCol>
                            <IonChip>{form.state}</IonChip>
                        </IonCol>
                        <IonCol>
                            <IonButtons>
                                <IonButton color="danger" onClick={() => handleDelete(form.uid)}>
                                    Удалить
                                </IonButton>
                                {(() => {
                                    if (form.state == 'open') {
                                        return (
                                            <IonButton color="warning" onClick={() => handleClose(form.uid)}>
                                                Закрыть
                                            </IonButton>
                                        )
                                    }
                                })()}
                                <IonButton color="secondary"
                                           onClick={() => handleSave(form.uid, form.address, form.passport, form.fioAddress, form.fio, form.note, form.price)}>
                                    Сохранить
                                </IonButton>
                            </IonButtons>
                        </IonCol>
                    </IonRow>)
            }
        </IonGrid>
    )
}


export default FormList;
