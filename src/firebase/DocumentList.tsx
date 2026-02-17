import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { firestoreBase, storage, auth } from './Firebase';
import { IonGrid, IonRow, IonCol, IonLabel, IonButton, IonSpinner, IonChip } from '@ionic/react';
import { documentTextOutline, downloadOutline, trashOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

export interface DocumentRecord {
  id: string;
  projectId: string;
  projectAddress?: string;
  name: string;
  type: string;
  storagePath: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface DocumentListProps {
  projectId: string | null;
  projectAddress?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ projectId, projectAddress }) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const coll = collection(firestoreBase, 'documents');
    const q = projectId
      ? query(coll, where('projectId', '==', projectId), orderBy('uploadedAt', 'desc'))
      : query(coll, orderBy('uploadedAt', 'desc'));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      projectAddress: d.data().projectAddress || '',
    })) as DocumentRecord[];
    setDocs(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handleDelete = async (rec: DocumentRecord) => {
    if (!window.confirm(`Удалить «${rec.name}»?`)) return;
    try {
      const storageRef = ref(storage, rec.storagePath);
      await deleteObject(storageRef);
    } catch (_) {}
    await deleteDoc(doc(firestoreBase, 'documents', rec.id));
    load();
  };

  const handleDownload = async (rec: DocumentRecord) => {
    try {
      const storageRef = ref(storage, rec.storagePath);
      const url = await getDownloadURL(storageRef);
      const a = document.createElement('a');
      a.href = url;
      a.download = rec.name;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    } catch (e) {
      console.error(e);
      alert('Не удалось скачать файл');
    }
  };

  if (loading) {
    return (
      <div className="ion-text-center ion-padding">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <p className="ion-padding ion-text-center" color="medium">
        {projectId ? 'Нет документов по этому объекту.' : 'Нет загруженных документов.'}
      </p>
    );
  }

  return (
    <IonGrid>
      <IonRow>
        <IonCol size="12" sizeMd="6">
          <IonLabel className="ion-text-bold">Документ</IonLabel>
        </IonCol>
        {!projectId && (
          <IonCol size="12" sizeMd="3">
            <IonLabel className="ion-text-bold">Объект</IonLabel>
          </IonCol>
        )}
        <IonCol size="12" sizeMd={projectId ? '6' : '3'}>
          <IonLabel className="ion-text-bold">Действия</IonLabel>
        </IonCol>
      </IonRow>
      {docs.map((rec) => (
        <IonRow key={rec.id} className="ion-align-items-center">
          <IonCol size="12" sizeMd="6">
            <IonIcon icon={documentTextOutline} className="ion-margin-end" />
            <IonLabel>{rec.name}</IonLabel>
            <IonChip>{rec.type || 'Файл'}</IonChip>
          </IonCol>
          {!projectId && (
            <IonCol size="12" sizeMd="3">
              <IonLabel>{rec.projectAddress || rec.projectId || '—'}</IonLabel>
            </IonCol>
          )}
          <IonCol size="12" sizeMd={projectId ? '6' : '3'}>
            <IonButton size="small" fill="clear" onClick={() => handleDownload(rec)}>
              <IonIcon icon={downloadOutline} />
              Скачать
            </IonButton>
            <IonButton size="small" fill="clear" color="danger" onClick={() => handleDelete(rec)}>
              <IonIcon icon={trashOutline} />
              Удалить
            </IonButton>
          </IonCol>
        </IonRow>
      ))}
    </IonGrid>
  );
};

export default DocumentList;
