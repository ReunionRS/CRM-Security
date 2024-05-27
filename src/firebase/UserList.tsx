import React, {useEffect, useState} from "react";
import {firestoreBase} from './Firebase';
import {collection, deleteDoc, doc, getDocs} from "firebase/firestore";
import 'firebase/auth';


function UserList() {

    const [users, setUsers] = useState([])


    const value = collection(firestoreBase, "users")

    const getUsers = async () => {
        const dbForms = await getDocs(value)
        setUsers(dbForms.docs.map(doc => ({...doc.data(), uid: doc.id})))
    }

    useEffect(() => {
        getUsers();
    }, []);


    return (
        <ion-grid>
            <ion-row>
                <ion-col><ion-title color="primary" class="ion-no-padding">ФИО Клиента</ion-title></ion-col>
                <ion-col>
                    <ion-title color="primary" className="ion-no-padding">Email</ion-title>
                </ion-col>
            </ion-row>
            {
                users.map(form =>
                    <ion-row key={form.uid}>
                        <ion-col>
                            {form.fio}
                        </ion-col>
                        <ion-col>
                            {form.email}
                        </ion-col>
                    </ion-row>)
            }
        </ion-grid>
    )
}


export default UserList;
