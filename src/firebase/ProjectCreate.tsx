import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { firestoreBase } from './Firebase';
import { Project, CONSTRUCTION_STAGES, ProjectStage } from '../models/Project';
import {
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  useIonToast,
} from '@ionic/react';

const ProjectCreate: React.FC = () => {
  const [present] = useIonToast();
  const [clientFio, setClientFio] = useState('');
  const [clientContacts, setClientContacts] = useState('');
  const [constructionAddress, setConstructionAddress] = useState('');
  const [projectType, setProjectType] = useState<'typical' | 'individual'>('typical');
  const [areaSqm, setAreaSqm] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');

  const coll = collection(firestoreBase, 'projects');

  const toast = (text: string, color: 'success' | 'danger') => {
    present({ message: text, duration: 2000, position: 'bottom', color });
  };

  const defaultStages: ProjectStage[] = CONSTRUCTION_STAGES.map((name, i) => ({
    id: `stage-${i}`,
    name,
    plannedStart: '',
    plannedEnd: '',
    status: 'not_started',
  }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(coll, {
        clientFio,
        clientContacts,
        constructionAddress,
        projectType,
        areaSqm: Number(areaSqm),
        estimatedCost: Number(estimatedCost),
        status: 'in_progress',
        startDate,
        plannedEndDate,
        stages: defaultStages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast('Объект создан', 'success');
      setClientFio('');
      setClientContacts('');
      setConstructionAddress('');
      setAreaSqm(0);
      setEstimatedCost(0);
      setStartDate('');
      setPlannedEndDate('');
      window.location.href = '/projects';
    } catch (err) {
      toast('Ошибка создания', 'danger');
    }
  };

  return (
    <form onSubmit={handleCreate}>
      <IonList>
        <IonItem>
          <IonInput
            label="ФИО клиента"
            labelPlacement="floating"
            value={clientFio}
            onIonInput={(e) => setClientFio(String(e.detail.value ?? ''))}
            required
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Контактные данные"
            labelPlacement="floating"
            placeholder="Телефон, email"
            value={clientContacts}
            onIonInput={(e) => setClientContacts(String(e.detail.value ?? ''))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Адрес строительства"
            labelPlacement="floating"
            value={constructionAddress}
            onIonInput={(e) => setConstructionAddress(String(e.detail.value ?? ''))}
            required
          />
        </IonItem>
        <IonItem>
          <IonSelect
            label="Тип проекта"
            value={projectType}
            onIonChange={(e) => setProjectType(e.detail.value)}
          >
            <IonSelectOption value="typical">Типовой</IonSelectOption>
            <IonSelectOption value="individual">Индивидуальный</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonInput
            label="Площадь дома (м²)"
            labelPlacement="floating"
            type="number"
            value={areaSqm}
            onIonInput={(e) => setAreaSqm(Number(e.detail.value ?? 0))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Сметная стоимость (₽)"
            labelPlacement="floating"
            type="number"
            value={estimatedCost}
            onIonInput={(e) => setEstimatedCost(Number(e.detail.value ?? 0))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Дата начала строительства"
            labelPlacement="floating"
            type="date"
            value={startDate}
            onIonInput={(e) => setStartDate(String(e.detail.value ?? ''))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Плановая дата завершения"
            labelPlacement="floating"
            type="date"
            value={plannedEndDate}
            onIonInput={(e) => setPlannedEndDate(String(e.detail.value ?? ''))}
          />
        </IonItem>
      </IonList>
      <IonButton expand="block" type="submit">
        Создать объект
      </IonButton>
    </form>
  );
};

export default ProjectCreate;
