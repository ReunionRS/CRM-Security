import React, { useEffect, useState } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  useIonToast,
  IonLabel,
} from '@ionic/react';
import { Project, getDefaultConstructionStages } from '../models/Project';
import { documentsApi, projectsApi, usersApi } from '../api/services';

const ProjectCreate: React.FC = () => {
  const [present] = useIonToast();
  const [clientFio, setClientFio] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [constructionAddress, setConstructionAddress] = useState('');
  const [projectType, setProjectType] = useState<'typical' | 'individual'>('typical');
  const [areaSqm, setAreaSqm] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [cameraUrl, setCameraUrl] = useState('');
  const [clientUserId, setClientUserId] = useState<string | undefined>(undefined);
  const [projectPdfFile, setProjectPdfFile] = useState<File | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; fio: string; email?: string }>>([]);

  const toast = (text: string, color: 'success' | 'danger') => {
    present({ message: text, duration: 2000, position: 'bottom', color });
  };

  const defaultStages = getDefaultConstructionStages();

  useEffect(() => {
    const loadClients = async () => {
      const users = await usersApi.list();
      const list = users
        .filter((u) => u.role === 'client')
        .map((u) => ({
          id: u.id,
          fio: u.fio || u.email || 'Клиент',
          email: u.email,
        }));
      setClients(list);
    };
    loadClients().catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalClientUserId = clientUserId;
      let finalClientFio = clientFio;
      let finalClientPhone = clientPhone;
      let finalClientEmail = clientEmail;

      if (clientUserId) {
        const selectedClient = clients.find((c) => c.id === clientUserId);
        if (selectedClient) {
          finalClientFio = selectedClient.fio;
          finalClientEmail = selectedClient.email || clientEmail;
        }
      } else if (clientFio) {
        const matchedClient = clients.find((c) => c.fio.toLowerCase() === clientFio.toLowerCase());
        if (matchedClient) {
          finalClientUserId = matchedClient.id;
          finalClientEmail = matchedClient.email || clientEmail;
        }
      }

      const payload: Project = {
        clientFio: finalClientFio,
        clientContacts: finalClientPhone,
        clientPhone: finalClientPhone,
        clientEmail: finalClientEmail,
        clientUserId: finalClientUserId || undefined,
        constructionAddress,
        projectType,
        areaSqm: Number(areaSqm),
        estimatedCost: Number(estimatedCost),
        status: 'in_progress',
        startDate,
        plannedEndDate,
        cameraUrl,
        stages: defaultStages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = await projectsApi.create(payload);
      if (projectPdfFile && created.id) {
        await documentsApi.upload({
          projectId: created.id,
          clientUserId: finalClientUserId || undefined,
          docType: 'Проект строения',
          file: projectPdfFile,
        });
      }
      toast('Объект создан', 'success');
      setClientFio('');
      setClientPhone('');
      setClientEmail('');
      setConstructionAddress('');
      setAreaSqm(0);
      setEstimatedCost(0);
      setStartDate('');
      setPlannedEndDate('');
      setCameraUrl('');
      setClientUserId(undefined);
      setProjectPdfFile(null);
      window.location.href = '/projects';
    } catch {
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
            label="Телефон"
            labelPlacement="floating"
            placeholder="+7..."
            value={clientPhone}
            onIonInput={(e) => setClientPhone(String(e.detail.value ?? ''))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Email клиента"
            labelPlacement="floating"
            type="email"
            placeholder="name@example.com"
            value={clientEmail}
            onIonInput={(e) => setClientEmail(String(e.detail.value ?? ''))}
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
          <IonLabel>Клиент (пользователь)</IonLabel>
          <IonSelect
            value={clientUserId}
            placeholder={clients.length ? 'Выберите клиента' : 'Нет пользователей с ролью Клиент'}
            onIonChange={(e) => setClientUserId(e.detail.value ?? undefined)}
          >
            {clients.map((c) => (
              <IonSelectOption key={c.id} value={c.id}>
                {c.fio} {c.email ? `(${c.email})` : ''}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonSelect label="Тип проекта" value={projectType} onIonChange={(e) => setProjectType(e.detail.value)}>
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
        <IonItem>
          <IonInput
            label="URL камеры (http(s)/HLS/RTSP)"
            labelPlacement="floating"
            placeholder="Например, https://... или rtsp://..."
            value={cameraUrl}
            onIonInput={(e) => setCameraUrl(String(e.detail.value ?? ''))}
          />
        </IonItem>
        <IonItem lines="none">
          <div style={{ width: '100%' }}>
            <IonLabel style={{ display: 'block', marginBottom: '8px' }}>PDF проекта строения</IonLabel>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setProjectPdfFile(file);
              }}
            />
            <div style={{ marginTop: '6px', fontSize: '0.85rem', opacity: 0.75 }}>
              {projectPdfFile ? `Файл: ${projectPdfFile.name}` : 'Файл не выбран'}
            </div>
          </div>
        </IonItem>
      </IonList>
      <IonButton expand="block" type="submit">
        Создать объект
      </IonButton>
    </form>
  );
};

export default ProjectCreate;
