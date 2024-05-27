import 'firebase/auth';
import {addDoc, collection, deleteDoc, doc, getDocs, updateDoc} from "firebase/firestore";
import React, {useEffect, useState} from "react";
import {firestoreBase} from "./Firebase";
import {Form} from "../models/Form";
import {IonChip, IonInput, IonTextarea} from "@ionic/react";


const LocationList: React.FC = () => {

    const [object, setObjects] = useState([])

    const [isEditing, setIsEditing] = useState(false)


    const value = collection(firestoreBase, "objects")

    const getData = async () => {
            const dbForms = await getDocs(value)
            setObjects(dbForms.docs.map(doc => ({...doc.data(), uid: doc.id})))
    }

    useEffect(() => {
        getData();
    }, []);

    const handleDelete = async (uid: number) => {
        const deleteVal = doc(firestoreBase, "objects/" + uid.toString())
        await deleteDoc(deleteVal)
    }

    const handleSave = async (uid: number, address: string, entryPointsAmount: string, exitPointsAmount: string, fio: string, guardList:string) => {
        const updateVal = doc(firestoreBase, "objects/" + uid)
        await updateDoc(updateVal, {
            address: address,
            entryPointsAmount: entryPointsAmount,
            exitPointsAmount: exitPointsAmount,
            fio: fio,
            guardList: guardList,
        });
        location.reload();
    }
    const handleActivate = async (uid: string) => {
        const updateVal = doc(firestoreBase, "objects/" + uid)
        await updateDoc(updateVal, {state: 'active'});
        location.reload();
    }

    const handleDeactivate = async (uid: string) => {
        const updateVal = doc(firestoreBase, "objects/" + uid)
        await updateDoc(updateVal, {state: 'inactive'});
        location.reload();
    }

    const handleEmergency = async (uid: string, fio: string, address: string) => {
        const updateVal = doc(firestoreBase, "objects/" + uid)
        await updateDoc(updateVal, {state: 'emergency'});
        const newForm = new Form(address, '', '', fio, '', 0);
        const docRef = await addDoc(collection(firestoreBase, "forms"), {
            address: newForm.address,
            passport: newForm.passport,
            fioAddress: newForm.fioAddress,
            fio: newForm.fio,
            note: newForm.note,
            price: newForm.price,
            state: 'open'
        });
        location.reload();
    }

    return (
        <ion-grid>
            <ion-row>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">Адрес объекта</ion-title>
                </ion-col>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">Количество входов</ion-title>
                </ion-col>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">Количество выходов</ion-title>
                </ion-col>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">Список лиц</ion-title>
                </ion-col>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">ФИО</ion-title>
                </ion-col>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">Статус</ion-title>
                </ion-col>
                <ion-col>
                    <ion-title color="primary" class="ion-no-padding">Действие</ion-title>
                </ion-col>
            </ion-row>
            {
                object.map(object =>
                    <ion-row key={object.uid}>
                        <ion-col>
                            <IonInput
                                labelPlacement="floating"
                                placeholder=""
                                value={object.address}
                                onIonInput= {(event) => {
                                    object.address = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </ion-col>
                        <ion-col>
                            <IonInput
                                labelPlacement="floating"
                                placeholder=""
                                type="number"
                                value={object.entryPointsAmount}
                                onIonInput= {(event) => {
                                    object.entryPointsAmount= (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </ion-col>
                        <ion-col>
                            <IonInput
                                labelPlacement="floating"
                                placeholder=""
                                type="number"
                                value={object.exitPointsAmount}
                                onIonInput= {(event) => {
                                    object.exitPointsAmount = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </ion-col>
                        <ion-col>
                            <IonTextarea
                                labelPlacement="floating"
                                placeholder=""
                                value={object.guardList}
                                onIonInput= {(event) => {
                                    object.guardList = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonTextarea>
                        </ion-col>
                        <ion-col>
                            <IonInput
                                labelPlacement="floating"
                                placeholder=""
                                value={object.fio}
                                onIonInput= {(event) => {
                                    object.fio = (event.target as HTMLInputElement).value;
                                }}
                                required
                            >
                            </IonInput>
                        </ion-col>
                        <ion-col>
                            <IonChip>{object.state}</IonChip>
                        </ion-col>
                        <ion-col class="activities">
                            <ion-buttons>
                                {(() => {
                                    if (object.state == 'inactive' || object.state == 'emergency') {
                                        return (
                                            <ion-button color="success" onClick={() => handleActivate(object.uid)}>
                                                Активировать
                                            </ion-button>
                                        )
                                    }
                                })()}
                                {(() => {
                                    if (object.state === 'active') {
                                        return (
                                            <ion-button color="secondary" onClick={() => handleDeactivate(object.uid)}>
                                                Деактивировать
                                            </ion-button>
                                        )
                                    }
                                })()}
                                {(() => {
                                    if (object.state == 'active') {
                                        return (
                                            <ion-button color="warning"
                                                        onClick={() => handleEmergency(object.uid, object.fio, object.address)}>
                                                Экстрененная ситуация
                                            </ion-button>
                                        )
                                    }
                                })()}
                                <ion-button color="danger" onClick={() => handleDelete(object.uid)}>
                                    Удалить
                                </ion-button>
                                <ion-button color="secondary" onClick={() => handleSave(object.uid, object.address,object.entryPointsAmount,object.exitPointsAmount,object.fio,object.guardList)}>
                                    Сохранить
                                </ion-button>
                            </ion-buttons>
                        </ion-col>
                    </ion-row>)
            }
        </ion-grid>
    )
}

export default LocationList;
