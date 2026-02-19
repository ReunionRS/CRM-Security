import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Project, ProjectStage, CONSTRUCTION_STAGES, StageStatus } from '../models/Project';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  useIonToast,
  IonModal,
  IonIcon,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, close } from 'ionicons/icons';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext';
import { projectsApi, usersApi } from '../api/services';
import { backendAssetUrl } from '../api/http';

const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  not_started: 'Не начат',
  in_progress: 'В работе',
  completed: 'Завершён',
  overdue: 'Просрочен',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_progress: 'В работе',
  completed: 'Завершён',
  on_hold: 'Приостановлен',
  cancelled: 'Отменён',
};

function isStageOverdue(stage: ProjectStage): boolean {
  if (stage.status === 'completed') return false;
  if (!stage.plannedEnd) return false;
  return new Date(stage.plannedEnd) < new Date();
}

function ensureStages(project: Project): ProjectStage[] {
  const existing = project.stages || [];
  return CONSTRUCTION_STAGES.map((name, i) => {
    const found = existing.find((s) => s.name === name);
    return (
      found || {
        id: `stage-${i}`,
        name,
        plannedStart: '',
        plannedEnd: '',
        status: 'not_started' as StageStatus,
      }
    );
  });
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [present] = useIonToast();
  const { role } = useAuth();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editClientFio, setEditClientFio] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editStatus, setEditStatus] = useState<string>('draft');
  const [editClientUserId, setEditClientUserId] = useState('');
  const [uploadingStageIndex, setUploadingStageIndex] = useState<number | null>(null);
  const [clients, setClients] = useState<Array<{ id: string; fio: string; email?: string }>>([]);

  const [editStageModalOpen, setEditStageModalOpen] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [editingPlannedStart, setEditingPlannedStart] = useState('');
  const [editingPlannedEnd, setEditingPlannedEnd] = useState('');

  const [contractAmount, setContractAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [lastPaymentDate, setLastPaymentDate] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryZoom, setGalleryZoom] = useState(1);
  const [galleryPanX, setGalleryPanX] = useState(0);
  const [galleryPanY, setGalleryPanY] = useState(0);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [galleryMoved, setGalleryMoved] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const data = await projectsApi.get(id);
      setProject(data);
      setStages(ensureStages(data));
      setContractAmount(data.contractAmount ?? 0);
      setPaidAmount(data.paidAmount ?? 0);
      setNextPaymentDate(data.nextPaymentDate ?? '');
      setLastPaymentDate(data.lastPaymentDate ?? '');
      setEditAddress(data.constructionAddress);
      setEditClientFio(data.clientFio);
      setEditClientPhone(data.clientPhone || data.clientContacts || '');
      setEditClientEmail(data.clientEmail || '');
      setEditStatus(data.status);
      setEditClientUserId(data.clientUserId || '');
    };
    load().catch((error) => {
      present({
        message: error instanceof Error ? error.message : 'Ошибка загрузки проекта',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    });
  }, [id]);

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

  const persistProjectPatch = async (patch: Partial<Project>) => {
    if (!id) return;
    const updated = await projectsApi.update(id, patch);
    setProject(updated);
    setStages(ensureStages(updated));
  };

  const updateStage = async (index: number, patch: Partial<ProjectStage>) => {
    if (role === 'client') {
      present({ message: 'У вас нет прав для изменения статуса этапов', duration: 2000, position: 'bottom', color: 'warning' });
      return;
    }

    const next = stages.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setStages(next);
    try {
      await persistProjectPatch({ stages: next, updatedAt: new Date().toISOString() });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка обновления этапа',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  const markOverdue = (stage: ProjectStage): StageStatus => {
    if (stage.status === 'completed') return 'completed';
    if (isStageOverdue(stage)) return 'overdue';
    return stage.status;
  };

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPercent = CONSTRUCTION_STAGES.length ? Math.round((completedCount / CONSTRUCTION_STAGES.length) * 100) : 0;

  const parsedStages = stages
    .map((s) => ({
      ...s,
      start: s.plannedStart ? new Date(s.plannedStart) : null,
      end: s.plannedEnd ? new Date(s.plannedEnd) : null,
    }))
    .filter((s) => s.start && s.end) as Array<ProjectStage & { start: Date; end: Date }>;

  const timeRanges = parsedStages.map((s) => ({
    startMs: s.start.getTime(),
    endMs: s.end.getTime(),
  }));

  const minTime = timeRanges.length > 0 ? Math.min(...timeRanges.map((t) => t.startMs)) : null;
  const maxTime = timeRanges.length > 0 ? Math.max(...timeRanges.map((t) => t.endMs)) : null;
  const totalMs = minTime !== null && maxTime !== null ? maxTime - minTime || 1 : 1;

  const debt = Math.max((project?.contractAmount ?? contractAmount) - (project?.paidAmount ?? paidAmount), 0);
  const paidPercent =
    (project?.contractAmount ?? contractAmount) > 0
      ? Math.round(((project?.paidAmount ?? paidAmount) / (project?.contractAmount ?? contractAmount)) * 100)
      : 0;

  const isPaymentOverdue =
    debt > 0 && (project?.nextPaymentDate ?? nextPaymentDate) && new Date(project?.nextPaymentDate ?? nextPaymentDate) < new Date();

  const canEditFinance = role === 'admin' || role === 'director' || role === 'accountant' || role === 'manager';
  const canEditProject = role === 'admin' || role === 'director' || role === 'manager';

  const handleSaveEdit = async () => {
    if (!id) return;

    let clientFio = editClientFio;
    let clientPhone = editClientPhone;
    let clientEmail = editClientEmail;
    let finalClientUserId = editClientUserId;

    if (editClientUserId) {
      const selectedClient = clients.find((c) => c.id === editClientUserId);
      if (selectedClient) {
        clientFio = selectedClient.fio || editClientFio;
        clientEmail = selectedClient.email || editClientEmail;
      }
    } else if (editClientFio) {
      const matchingClient = clients.find((c) => c.fio.toLowerCase() === editClientFio.toLowerCase());
      if (matchingClient) {
        finalClientUserId = matchingClient.id;
        clientEmail = matchingClient.email || clientEmail;
      }
    }

    try {
      await persistProjectPatch({
        constructionAddress: editAddress,
        clientFio,
        clientPhone,
        clientContacts: clientPhone,
        clientEmail,
        clientUserId: finalClientUserId || undefined,
        status: editStatus as Project['status'],
        updatedAt: new Date().toISOString(),
      });
      setEditModalOpen(false);
      present({ message: 'Объект обновлен', duration: 2000, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка обновления объекта',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  const handleStageImageUpload = async (index: number, files: File[]) => {
    if (!id) return;

    if (role === 'client') {
      present({ message: 'У вас нет прав для загрузки изображений', duration: 2000, position: 'bottom', color: 'warning' });
      return;
    }

    setUploadingStageIndex(index);
    try {
      const updated = await projectsApi.uploadStagePhotos(id, index, files);
      setProject(updated);
      setStages(ensureStages(updated));
      present({ message: 'Изображения загружены', duration: 2000, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка загрузки изображения',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    } finally {
      setUploadingStageIndex(null);
    }
  };

  const openGallery = (images: string[], startIndex: number) => {
    if (!images.length) return;
    setGalleryImages(images);
    setGalleryIndex(startIndex);
    setGalleryZoom(1);
    setGalleryPanX(0);
    setGalleryPanY(0);
    setGalleryOpen(true);
  };

  const prevGallery = () => {
    if (!galleryImages.length) return;
    setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setGalleryPanX(0);
    setGalleryPanY(0);
  };

  const nextGallery = () => {
    if (!galleryImages.length) return;
    setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
    setGalleryPanX(0);
    setGalleryPanY(0);
  };

  const zoomInGallery = () => setGalleryZoom((prev) => Math.min(prev + 0.25, 3));
  const zoomOutGallery = () =>
    setGalleryZoom((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setGalleryPanX(0);
        setGalleryPanY(0);
      }
      return next;
    });

  const handleGalleryPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (galleryZoom <= 1) return;
    setGalleryDragging(true);
    setGalleryMoved(false);
    (e.currentTarget as HTMLImageElement).setPointerCapture(e.pointerId);
    (e.currentTarget as any)._dragStart = {
      x: e.clientX,
      y: e.clientY,
      panX: galleryPanX,
      panY: galleryPanY,
    };
  };

  const handleGalleryPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!galleryDragging || galleryZoom <= 1) return;
    const start = (e.currentTarget as any)._dragStart as { x: number; y: number; panX: number; panY: number } | undefined;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setGalleryMoved(true);
    setGalleryPanX(start.panX + dx);
    setGalleryPanY(start.panY + dy);
  };

  const handleGalleryPointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if ((e.currentTarget as HTMLImageElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLImageElement).releasePointerCapture(e.pointerId);
    }
    setGalleryDragging(false);
    if (!galleryMoved && galleryImages.length > 1) {
      nextGallery();
    }
  };

  const handleRemovePhoto = async (stageIndex: number, photoUrl: string) => {
    if (!id) return;
    try {
      const updated = await projectsApi.deleteStagePhoto(id, stageIndex, photoUrl);
      setProject(updated);
      setStages(ensureStages(updated));
      present({ message: 'Изображение удалено', duration: 2000, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка удаления изображения',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  const handleSaveFinance = async () => {
    if (!id) return;
    try {
      await persistProjectPatch({
        contractAmount,
        paidAmount,
        nextPaymentDate: nextPaymentDate || '',
        lastPaymentDate: lastPaymentDate || '',
        updatedAt: new Date().toISOString(),
      });
      present({ message: 'Финансы обновлены', duration: 2000, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка обновления финансов',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  const openEditStageModal = (index: number) => {
    if (role === 'client') {
      present({ message: 'У вас нет прав для редактирования дат этапов', duration: 2000, position: 'bottom', color: 'warning' });
      return;
    }
    const stage = stages[index];
    setEditingStageIndex(index);
    setEditingPlannedStart(stage.plannedStart || '');
    setEditingPlannedEnd(stage.plannedEnd || '');
    setEditStageModalOpen(true);
  };

  const handleSaveStageDates = async () => {
    if (editingStageIndex === null || !id) return;

    const updatedStages = stages.map((s, i) =>
      i === editingStageIndex ? { ...s, plannedStart: editingPlannedStart, plannedEnd: editingPlannedEnd } : s
    );

    setStages(updatedStages);
    try {
      await persistProjectPatch({ stages: updatedStages, updatedAt: new Date().toISOString() });
      setEditStageModalOpen(false);
      setEditingStageIndex(null);
      setEditingPlannedStart('');
      setEditingPlannedEnd('');
      present({ message: 'Даты этапа обновлены', duration: 2000, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка обновления дат этапа',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  if (!project) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Загрузка...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent />
      </IonPage>
    );
  }

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/projects" />
          </IonButtons>
          <IonTitle>Объект</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IonCardTitle>Карточка объекта</IonCardTitle>
              {canEditProject && (
                <IonButton fill="clear" size="small" onClick={() => setEditModalOpen(true)}>
                  Редактировать
                </IonButton>
              )}
            </div>
            <IonChip color="primary">{STATUS_LABELS[project.status] || project.status}</IonChip>
          </IonCardHeader>
          <IonCardContent>
            <p><strong>ФИО клиента:</strong> {project.clientFio}</p>
            <p><strong>Телефон:</strong> {project.clientPhone || project.clientContacts || '—'}</p>
            <p><strong>Email:</strong> {project.clientEmail || '—'}</p>
            <p><strong>Адрес:</strong> {project.constructionAddress}</p>
            <p><strong>Тип:</strong> {project.projectType === 'typical' ? 'Типовой' : 'Индивидуальный'}</p>
            <p><strong>Площадь:</strong> {project.areaSqm} м²</p>
            <p><strong>Сметная стоимость:</strong> {project.estimatedCost?.toLocaleString('ru-RU')} ₽</p>
            <p><strong>Дата начала:</strong> {project.startDate || '—'}</p>
            <p><strong>План сдачи:</strong> {project.plannedEndDate || '—'}</p>
            {project.actualEndDate && <p><strong>Факт. сдача:</strong> {project.actualEndDate}</p>}
            <div className="project-progress ion-margin-top">
              <IonLabel>
                Готовность: <strong>{progressPercent}%</strong>
              </IonLabel>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {project.cameraUrl && (
              <div className="ion-margin-top">
                <h3>Камера объекта</h3>
                {project.cameraUrl.startsWith('http') ? (
                  <>
                    <video controls style={{ width: '100%', maxHeight: 320, background: '#000' }} src={project.cameraUrl}>
                      Ваш браузер не поддерживает воспроизведение этого формата.
                    </video>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Ожидается HTTP/HLS поток (например, прокси для RTSP).</p>
                  </>
                ) : (
                  <>
                    <p>
                      Поток камеры: <a href={project.cameraUrl}>{project.cameraUrl}</a>
                    </p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Для RTSP-потоков используйте внешний плеер (VLC, NVR или прокси в HLS).
                    </p>
                  </>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Финансы</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p><strong>Сумма договора:</strong> {(project.contractAmount ?? contractAmount)?.toLocaleString('ru-RU') || 0} ₽</p>
            <p>
              <strong>Оплачено:</strong> {(project.paidAmount ?? paidAmount)?.toLocaleString('ru-RU') || '0'} ₽ ({paidPercent}%)
            </p>
            <p><strong>Задолженность:</strong> {debt.toLocaleString('ru-RU')} ₽</p>
            <p><strong>Дата следующего платежа:</strong> {(project.nextPaymentDate ?? nextPaymentDate) || '—'}</p>
            <p><strong>Дата последнего платежа:</strong> {(project.lastPaymentDate ?? lastPaymentDate) || '—'}</p>

            <div className="ion-margin-vertical">
              {debt === 0 ? (
                <IonChip color="success">Оплачено</IonChip>
              ) : isPaymentOverdue ? (
                <IonChip color="danger">Просрочка платежа</IonChip>
              ) : (
                <IonChip color="warning">Есть задолженность</IonChip>
              )}
            </div>

            {canEditFinance && (
              <>
                <IonItem>
                  <IonInput
                    label="Сумма договора (₽)"
                    labelPlacement="floating"
                    type="number"
                    value={contractAmount}
                    onIonInput={(e) => setContractAmount(Number(e.detail.value ?? 0))}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Оплачено (₽)"
                    labelPlacement="floating"
                    type="number"
                    value={paidAmount}
                    onIonInput={(e) => setPaidAmount(Number(e.detail.value ?? 0))}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Дата последнего платежа"
                    labelPlacement="floating"
                    type="date"
                    value={lastPaymentDate}
                    onIonInput={(e) => setLastPaymentDate(String(e.detail.value ?? ''))}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Дата следующего платежа"
                    labelPlacement="floating"
                    type="date"
                    value={nextPaymentDate}
                    onIonInput={(e) => setNextPaymentDate(String(e.detail.value ?? ''))}
                  />
                </IonItem>
                <IonButton className="ion-margin-top" expand="block" onClick={handleSaveFinance}>
                  Сохранить финансы
                </IonButton>
              </>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Этапы строительства</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {stages.map((stage, index) => {
                const displayStatus = role === 'client' ? stage.status : markOverdue(stage);
                const isOverdue = role !== 'client' && displayStatus === 'overdue';
                return (
                  <div key={stage.id} className={isOverdue ? 'stage-overdue stage-item' : 'stage-item'}>
                    <IonItem>
                      <IonLabel>
                        <h2>{stage.name}</h2>
                        <p>
                          План: {stage.plannedStart || '—'} – {stage.plannedEnd || '—'}
                          {stage.actualStart && ` • Факт нач.: ${stage.actualStart}`}
                          {stage.actualEnd && ` • Факт ок.: ${stage.actualEnd}`}
                        </p>
                        {stage.responsible && <p>Ответственный: {stage.responsible}</p>}
                      </IonLabel>
                      {role !== 'client' && (
                        <>
                          <IonButton fill="clear" size="small" onClick={() => openEditStageModal(index)}>
                            Даты
                          </IonButton>
                          <IonSelect
                            value={stage.status}
                            onIonChange={(e) => updateStage(index, { status: e.detail.value as StageStatus })}
                            interface="action-sheet"
                            placeholder="Статус"
                          >
                            <IonSelectOption value="not_started">Не начат</IonSelectOption>
                            <IonSelectOption value="in_progress">В работе</IonSelectOption>
                            <IonSelectOption value="completed">Завершён</IonSelectOption>
                          </IonSelect>
                        </>
                      )}
                      {role === 'client' && (
                        <IonChip color="primary" slot="end">
                          {STAGE_STATUS_LABELS[stage.status]}
                        </IonChip>
                      )}
                    </IonItem>
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ marginBottom: '10px' }}>
                        {role !== 'client' && (
                          <>
                            <label
                              htmlFor={`file-input-${index}`}
                              style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--ion-color-primary)' }}
                            >
                              Загрузить фото этапа:
                            </label>
                            <input
                              id={`file-input-${index}`}
                              className="stage-file-input"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                const files = e.target.files ? Array.from(e.target.files) : [];
                                if (files.length) handleStageImageUpload(index, files);
                              }}
                              disabled={uploadingStageIndex === index}
                              style={{ fontSize: '0.85rem' }}
                            />
                          </>
                        )}
                      </div>
                      {stage.photoUrls && stage.photoUrls.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--ion-color-medium)' }}>
                            Фото ({stage.photoUrls.length}):
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                            {stage.photoUrls.map((photoUrl, idx) => (
                              <div
                                key={idx}
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  backgroundColor: '#f0f0f0',
                                }}
                              >
                                <img
                                  src={backendAssetUrl(photoUrl)}
                                  alt={`Stage ${index + 1} photo ${idx + 1}`}
                                  style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }}
                                  onClick={() => openGallery(stage.photoUrls || [], idx)}
                                />
                                {role !== 'client' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemovePhoto(index, photoUrl);
                                    }}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      right: 0,
                                      background: 'rgba(255, 0, 0, 0.8)',
                                      color: 'white',
                                      border: 'none',
                                      padding: '2px 6px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      borderRadius: '0 8px 0 4px',
                                    }}
                                  >
                                    x
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(!stage.photoUrls || stage.photoUrls.length === 0) && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--ion-color-medium)', margin: '8px 0' }}>
                          Фото пока не добавлено
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </IonList>

            {parsedStages.length > 0 && minTime !== null && maxTime !== null && (
              <div className="gantt-container">
                <IonLabel>
                  Диаграмма Gantt (плановые даты): {new Date(minTime).toLocaleDateString('ru-RU')} –{' '}
                  {new Date(maxTime).toLocaleDateString('ru-RU')}
                </IonLabel>
                {parsedStages.map((s) => {
                  const startOffset = ((s.start.getTime() - minTime) / totalMs) * 100;
                  const width = ((s.end.getTime() - s.start.getTime()) / totalMs) * 100;
                  return (
                    <div key={s.id} className="gantt-row">
                      <div className="gantt-row-label">{s.name}</div>
                      <div className="gantt-bar-track">
                        <div className="gantt-bar" style={{ left: `${startOffset}%`, width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={editModalOpen} onDidDismiss={() => setEditModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={() => setEditModalOpen(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Редактировать объект</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel>Выберите клиента</IonLabel>
              <IonSelect value={editClientUserId} onIonChange={(e) => setEditClientUserId(e.detail.value)}>
                <IonSelectOption value="">Нет привязки</IonSelectOption>
                {clients.map((client) => (
                  <IonSelectOption key={client.id} value={client.id}>
                    {client.fio} {client.email ? `(${client.email})` : ''}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonInput
                label="ФИО клиента"
                labelPlacement="floating"
                value={editClientFio}
                onIonInput={(e) => setEditClientFio(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Телефон"
                labelPlacement="floating"
                value={editClientPhone}
                onIonInput={(e) => setEditClientPhone(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Email"
                labelPlacement="floating"
                type="email"
                value={editClientEmail}
                onIonInput={(e) => setEditClientEmail(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Адрес"
                labelPlacement="floating"
                value={editAddress}
                onIonInput={(e) => setEditAddress(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Статус</IonLabel>
              <IonSelect value={editStatus} onIonChange={(e) => setEditStatus(e.detail.value)}>
                <IonSelectOption value="draft">Черновик</IonSelectOption>
                <IonSelectOption value="in_progress">В работе</IonSelectOption>
                <IonSelectOption value="completed">Завершён</IonSelectOption>
                <IonSelectOption value="on_hold">Приостановлен</IonSelectOption>
                <IonSelectOption value="cancelled">Отменён</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonButton expand="block" onClick={handleSaveEdit} className="ion-margin-top">
              Сохранить
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal isOpen={galleryOpen} onDidDismiss={() => setGalleryOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                Фото {galleryImages.length ? `${galleryIndex + 1}/${galleryImages.length}` : ''}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setGalleryOpen(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {galleryImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', gap: '12px' }}>
                <IonButton fill="clear" onClick={prevGallery}>
                  <IonIcon icon={chevronBackOutline} />
                </IonButton>
                <div>
                  <img
                    src={backendAssetUrl(galleryImages[galleryIndex])}
                    alt={`Фото ${galleryIndex + 1}`}
                    onPointerDown={handleGalleryPointerDown}
                    onPointerMove={handleGalleryPointerMove}
                    onPointerUp={handleGalleryPointerUp}
                    onPointerCancel={handleGalleryPointerUp}
                    style={{
                      width: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      background: '#111',
                      borderRadius: '10px',
                      transform: `translate(${galleryPanX}px, ${galleryPanY}px) scale(${galleryZoom})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease',
                      cursor: galleryZoom > 1 ? 'grab' : 'pointer',
                      touchAction: galleryZoom > 1 ? 'none' : 'auto',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                    <IonButton size="small" onClick={zoomOutGallery} disabled={galleryZoom <= 1}>
                      -
                    </IonButton>
                    <IonButton size="small" onClick={() => setGalleryZoom(1)}>
                      100%
                    </IonButton>
                    <IonButton size="small" onClick={zoomInGallery} disabled={galleryZoom >= 3}>
                      +
                    </IonButton>
                  </div>
                </div>
                <IonButton fill="clear" onClick={nextGallery}>
                  <IonIcon icon={chevronForwardOutline} />
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={editStageModalOpen} onDidDismiss={() => setEditStageModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={() => setEditStageModalOpen(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Редактировать даты этапа</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {editingStageIndex !== null && (
              <>
                <IonItem>
                  <IonInput
                    label="Плановое начало"
                    labelPlacement="floating"
                    type="date"
                    value={editingPlannedStart}
                    onIonInput={(e) => setEditingPlannedStart(String(e.detail.value ?? ''))}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Плановое завершение"
                    labelPlacement="floating"
                    type="date"
                    value={editingPlannedEnd}
                    onIonInput={(e) => setEditingPlannedEnd(String(e.detail.value ?? ''))}
                  />
                </IonItem>
                <IonButton expand="block" onClick={handleSaveStageDates} className="ion-margin-top">
                  Сохранить даты
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ProjectDetail;
