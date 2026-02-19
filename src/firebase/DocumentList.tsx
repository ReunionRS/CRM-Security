import React, { useEffect, useState } from 'react';
import { IonGrid, IonRow, IonCol, IonLabel, IonButton, IonSpinner, IonChip, IonIcon, useIonToast } from '@ionic/react';
import { documentTextOutline, downloadOutline, trashOutline } from 'ionicons/icons';
import { documentsApi } from '../api/services';
import type { DocumentRecord } from '../api/types';

interface DocumentListProps {
  projectId: string | null;
}

const DocumentList: React.FC<DocumentListProps> = ({ projectId }) => {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [present] = useIonToast();

  const load = async () => {
    setLoading(true);
    const list = await documentsApi.list({ projectId: projectId || undefined });
    setDocs(list);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [projectId]);

  const handleDelete = async (rec: DocumentRecord) => {
    if (!window.confirm(`Удалить «${rec.name}»?`)) return;
    try {
      await documentsApi.remove(rec.id);
      load();
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка удаления',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    }
  };

  const handleDownload = async (rec: DocumentRecord) => {
    const a = document.createElement('a');
    a.href = documentsApi.download(rec.id);
    a.download = rec.name;
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
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
