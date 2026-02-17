import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLabel,
  IonList,
  IonItem,
  IonButton,
  IonSelect,
  IonSelectOption,
  useIonToast,
} from '@ionic/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { documentTextOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import '../styles/styles.css';
import LogOut from '../components/LogOut';
import { useLocation } from 'react-router-dom';
import {
  deleteLocalDocument,
  getLocalDocumentBlob,
  listLocalDocuments,
  saveLocalDocument,
  type LocalDocumentRecord,
} from '../storage/docStore';

const DOC_TYPES = [
  'Договор подряда',
  'Приложения к договору',
  'Смета',
  'Акты выполненных работ',
  'Чеки',
  'Гарантийные обязательства',
  'Проектная документация',
];

const Documents: React.FC = () => {
  const location = useLocation();
  const [present] = useIonToast();
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const projectId = qs.get('projectId') || undefined;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [docs, setDocs] = useState<LocalDocumentRecord[]>([]);

  const toast = (message: string, color: 'success' | 'danger' | 'warning' = 'success') =>
    present({ message, duration: 2200, position: 'bottom', color });

  const reload = async () => {
    const list = await listLocalDocuments({ projectId });
    setDocs(list);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handlePickClick = () => fileInputRef.current?.click();

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPickedFile(f);
  };

  const handleSave = async () => {
    if (!pickedFile) {
      toast('Сначала выберите файл', 'warning');
      return;
    }
    await saveLocalDocument({ projectId, docType, file: pickedFile });
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Документ сохранён', 'success');
    await reload();
  };

  const handleDownload = async (id: string, fileName: string) => {
    const blob = await getLocalDocumentBlob(id);
    if (!blob) {
      toast('Файл не найден', 'danger');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить документ?')) return;
    await deleteLocalDocument(id);
    toast('Удалено', 'success');
    await reload();
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>CRM Строй — Документы</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Документооборот</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              Прикрепление документов включено. Сейчас файлы сохраняются <strong>локально (IndexedDB)</strong>.
              {projectId ? ` Привязка к объекту: ${projectId}` : ' (откройте из карточки объекта для привязки).'}
            </p>

            <IonList>
              <IonItem>
                <IonLabel>Тип документа</IonLabel>
                <IonSelect value={docType} onIonChange={(e) => setDocType(String(e.detail.value))}>
                  {DOC_TYPES.map((t) => (
                    <IonSelectOption key={t} value={t}>
                      {t}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel>
                  {pickedFile ? (
                    <>
                      <strong>Выбран:</strong> {pickedFile.name} ({Math.round(pickedFile.size / 1024)} KB)
                    </>
                  ) : (
                    'Файл не выбран'
                  )}
                </IonLabel>
                <IonButton slot="end" fill="outline" onClick={handlePickClick}>
                  Выбрать файл
                </IonButton>
                <input
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handlePick}
                />
              </IonItem>
              <IonItem lines="none">
                <IonButton expand="block" onClick={handleSave}>
                  Сохранить документ
                </IonButton>
              </IonItem>
            </IonList>

            <IonCard className="ion-margin-top">
              <IonCardHeader>
                <IonCardTitle>Сохранённые документы</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {docs.length === 0 ? (
                  <p>Пока нет документов.</p>
                ) : (
                  <IonList>
                    {docs.map((d) => (
                      <IonItem key={d.id}>
                        <IonIcon icon={documentTextOutline} slot="start" />
                        <IonLabel>
                          <strong>{d.docType}</strong>
                          <div>{d.fileName}</div>
                          <div>
                            v{d.version} • {(d.size / 1024).toFixed(1)} KB •{' '}
                            {new Date(d.uploadedAt).toLocaleString('ru-RU')}
                          </div>
                        </IonLabel>
                        <IonButton slot="end" fill="clear" onClick={() => handleDownload(d.id, d.fileName)}>
                          Скачать
                        </IonButton>
                        <IonButton slot="end" color="danger" fill="clear" onClick={() => handleDelete(d.id)}>
                          Удалить
                        </IonButton>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>

            <p className="ion-margin-top">Поддерживаемые типы документов:</p>
            <IonList>
              {DOC_TYPES.map((name) => (
                <IonItem key={name}>
                  <IonIcon icon={documentTextOutline} slot="start" />
                  <IonLabel>{name}</IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Documents;
