import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Project,
  ProjectStage,
  CONSTRUCTION_STAGES,
  StageStatus,
  STAGE_DESCRIPTION_ITEMS,
  getDefaultConstructionStages,
} from '../models/Project';
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
  IonTextarea,
  IonButton,
  useIonToast,
  IonModal,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, close } from 'ionicons/icons';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext';
import { documentsApi, projectsApi, usersApi } from '../api/services';
import { backendAssetUrl } from '../api/http';
import type { DocumentRecord } from '../api/types';

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
  const defaults = getDefaultConstructionStages();
  return CONSTRUCTION_STAGES.map((name, i) => {
    const found = existing.find((s) => s.name === name);
    const fallback = defaults[i];
    if (!found) return fallback;
    return {
      ...fallback,
      ...found,
      comments: found.comments || STAGE_DESCRIPTION_ITEMS[name].join('\n'),
    };
  });
}

function toStageAnchorId(index: number): string {
  return `stage-${index}`;
}

function formatDateRu(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ru-RU');
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [focusedStageIndex, setFocusedStageIndex] = useState<number | null>(null);
  const [present] = useIonToast();
  const { role } = useAuth();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editClientFio, setEditClientFio] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editStatus, setEditStatus] = useState<string>('draft');
  const [editProjectType, setEditProjectType] = useState<'typical' | 'individual'>('typical');
  const [editAreaSqm, setEditAreaSqm] = useState<number>(0);
  const [editEstimatedCost, setEditEstimatedCost] = useState<number>(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editPlannedEndDate, setEditPlannedEndDate] = useState('');
  const [editActualEndDate, setEditActualEndDate] = useState('');
  const [editCameraUrl, setEditCameraUrl] = useState('');
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
  const [financeEditorOpen, setFinanceEditorOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryZoom, setGalleryZoom] = useState(1);
  const [galleryPanX, setGalleryPanX] = useState(0);
  const [galleryPanY, setGalleryPanY] = useState(0);
  const [galleryDragging, setGalleryDragging] = useState(false);
  const [galleryMoved, setGalleryMoved] = useState(false);
  const [stageCommentDrafts, setStageCommentDrafts] = useState<Record<string, string>>({});
  const [projectPlanDoc, setProjectPlanDoc] = useState<DocumentRecord | null>(null);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewDoc, setDocumentPreviewDoc] = useState<DocumentRecord | null>(null);
  const [documentPreviewMode, setDocumentPreviewMode] = useState<'pdf' | 'docx' | 'unsupported' | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState('');
  const [documentPreviewHtml, setDocumentPreviewHtml] = useState('');
  const [documentPreviewError, setDocumentPreviewError] = useState('');

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
      setEditProjectType(data.projectType || 'typical');
      setEditAreaSqm(data.areaSqm ?? 0);
      setEditEstimatedCost(data.estimatedCost ?? 0);
      setEditStartDate(data.startDate || '');
      setEditPlannedEndDate(data.plannedEndDate || '');
      setEditActualEndDate(data.actualEndDate || '');
      setEditCameraUrl(data.cameraUrl || '');
      setEditClientUserId(data.clientUserId || '');

      const docs = await documentsApi.list({ projectId: id });
      const byProjectType = docs.filter((d) => /проект строения/i.test(d.type || ''));

      const projectDoc =
        byProjectType.find((d) => (d.mimeType || '').includes('pdf') || d.name.toLowerCase().endsWith('.pdf')) ||
        byProjectType.find((d) => d.name.toLowerCase().endsWith('.docx')) ||
        byProjectType[0] ||
        null;
      setProjectPlanDoc(projectDoc);
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
    return () => {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [documentPreviewUrl]);

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

  useEffect(() => {
    if (!stages.length) return;

    const searchParams = new URLSearchParams(location.search);
    const stageIndexRaw = searchParams.get('stageIndex');
    if (!stageIndexRaw) return;

    const stageIndex = Number(stageIndexRaw);
    if (!Number.isInteger(stageIndex) || stageIndex < 0 || stageIndex >= stages.length) return;

    const anchorId = toStageAnchorId(stageIndex);
    requestAnimationFrame(() => {
      const target = document.getElementById(anchorId);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setFocusedStageIndex(stageIndex);
      window.setTimeout(() => setFocusedStageIndex((prev) => (prev === stageIndex ? null : prev)), 2000);
    });
  }, [location.search, stages]);

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    stages.forEach((stage) => {
      nextDrafts[stage.id] = stage.stageComment || '';
    });
    setStageCommentDrafts(nextDrafts);
  }, [stages]);

  const persistProjectPatch = async (patch: Partial<Project>) => {
    if (!id) return;
    const updated = await projectsApi.update(id, patch);
    setProject(updated);
    setStages(ensureStages(updated));
  };

  const updateStage = async (index: number, patch: Partial<ProjectStage>): Promise<boolean> => {
    if (role === 'client') {
      present({ message: 'У вас нет прав для изменения статуса этапов', duration: 2000, position: 'bottom', color: 'warning' });
      return false;
    }

    const next = stages.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setStages(next);
    try {
      await persistProjectPatch({ stages: next, updatedAt: new Date().toISOString() });
      return true;
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка обновления этапа',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
      return false;
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
        projectType: editProjectType,
        areaSqm: Number.isFinite(editAreaSqm) ? editAreaSqm : 0,
        estimatedCost: Number.isFinite(editEstimatedCost) ? editEstimatedCost : 0,
        startDate: editStartDate || '',
        plannedEndDate: editPlannedEndDate || '',
        actualEndDate: editActualEndDate || '',
        cameraUrl: editCameraUrl || '',
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

  const handleSaveStageComment = async (index: number) => {
    const stage = stages[index];
    if (!stage) return;
    const comment = (stageCommentDrafts[stage.id] || '').trim();
    const ok = await updateStage(index, { stageComment: comment });
    if (ok) {
      present({ message: 'Комментарий этапа сохранён', duration: 1800, position: 'bottom', color: 'success' });
    }
  };

  const handleOpenDocumentPreview = async (doc: DocumentRecord) => {
    setDocumentPreviewDoc(doc);
    setDocumentPreviewError('');
    setDocumentPreviewHtml('');
    setDocumentPreviewMode(null);

    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
      setDocumentPreviewUrl('');
    }

    setDocumentPreviewLoading(true);
    setDocumentPreviewOpen(true);
    try {
      const blob = await documentsApi.getBlob(doc.id);
      const mime = (doc.mimeType || '').toLowerCase();
      const ext = doc.name.toLowerCase().split('.').pop() || '';

      if (mime.includes('pdf') || ext === 'pdf') {
        const url = URL.createObjectURL(blob);
        setDocumentPreviewUrl(url);
        setDocumentPreviewMode('pdf');
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth/mammoth.browser');
        const buffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setDocumentPreviewHtml(result.value || '<p>Документ пуст.</p>');
        setDocumentPreviewMode('docx');
      } else {
        setDocumentPreviewMode('unsupported');
        setDocumentPreviewError('Для этого формата встроенный просмотр недоступен. Нажмите "Скачать файл".');
      }
    } catch (error) {
      setDocumentPreviewMode('unsupported');
      setDocumentPreviewError(error instanceof Error ? error.message : 'Не удалось открыть документ');
      present({
        message: error instanceof Error ? error.message : 'Не удалось открыть документ',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    } finally {
      setDocumentPreviewLoading(false);
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
            <div className="project-pdf-block">
              <div className="project-pdf-title">Проект строения</div>
              {projectPlanDoc ? (
                <>
                  <div className="project-pdf-file">{projectPlanDoc.name}</div>
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => handleOpenDocumentPreview(projectPlanDoc)}
                    disabled={documentPreviewLoading}
                  >
                    {documentPreviewLoading ? 'Открываем...' : 'Открыть документ'}
                  </IonButton>
                </>
              ) : (
                <div className="project-pdf-empty">Файл проекта пока не загружен</div>
              )}
            </div>
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
            <p><strong>Дата следующего платежа:</strong> {formatDateRu(project.nextPaymentDate ?? nextPaymentDate)}</p>
            <p><strong>Дата последнего платежа:</strong> {formatDateRu(project.lastPaymentDate ?? lastPaymentDate)}</p>

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
                <IonButton
                  className="ion-margin-top"
                  fill="outline"
                  expand="block"
                  onClick={() => setFinanceEditorOpen((prev) => !prev)}
                >
                  {financeEditorOpen ? 'Скрыть редактирование' : 'Редактировать финансы'}
                </IonButton>
                {financeEditorOpen && (
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
                        label="Дата следующего платежа"
                        labelPlacement="floating"
                        type="date"
                        value={nextPaymentDate}
                        onIonInput={(e) => setNextPaymentDate(String(e.detail.value ?? ''))}
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
                    <IonButton className="ion-margin-top" expand="block" onClick={handleSaveFinance}>
                      Сохранить финансы
                    </IonButton>
                  </>
                )}
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
                const isFocused = focusedStageIndex === index;
                return (
                  <div
                    key={stage.id}
                    id={toStageAnchorId(index)}
                    className={`${isOverdue ? 'stage-overdue ' : ''}stage-item${isFocused ? ' stage-item-focused' : ''}`}
                  >
                    <div className="stage-item-head">
                      <div className="stage-item-info">
                        <h2>{stage.name}</h2>
                        <p>
                          План: {formatDateRu(stage.plannedStart)} – {formatDateRu(stage.plannedEnd)}
                          {stage.actualStart && ` • Факт нач.: ${formatDateRu(stage.actualStart)}`}
                          {stage.actualEnd && ` • Факт ок.: ${formatDateRu(stage.actualEnd)}`}
                        </p>
                        {stage.responsible && <p>Ответственный: {stage.responsible}</p>}
                        <details className="stage-description-details">
                          <summary className="stage-description-summary">Описание</summary>
                          <ul className="stage-description-list">
                            {(stage.comments || '')
                              .split('\n')
                              .map((line) => line.trim())
                              .filter(Boolean)
                              .map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                          </ul>
                        </details>
                      </div>
                      {role !== 'client' && (
                        <div className="stage-item-actions">
                          <IonButton fill="clear" size="small" onClick={() => openEditStageModal(index)}>
                            Даты
                          </IonButton>
                          <IonSelect
                            value={stage.status}
                            onIonChange={(e) => updateStage(index, { status: e.detail.value as StageStatus })}
                            interface={typeof window !== 'undefined' && window.innerWidth > 768 ? 'popover' : 'action-sheet'}
                            placeholder="Статус"
                          >
                            <IonSelectOption value="not_started">Не начат</IonSelectOption>
                            <IonSelectOption value="in_progress">В работе</IonSelectOption>
                            <IonSelectOption value="completed">Завершён</IonSelectOption>
                          </IonSelect>
                        </div>
                      )}
                      {role === 'client' && (
                        <div className="stage-client-status">
                          <IonChip color="primary">{STAGE_STATUS_LABELS[stage.status]}</IonChip>
                        </div>
                      )}
                    </div>
                    <div className="stage-body">
                      <div className="stage-photos-section">
                        <div className="stage-photos-header">Фото этапа</div>
                        {role !== 'client' && (
                          <div className="stage-upload-block">
                            <label htmlFor={`file-input-${index}`} className="stage-upload-label">
                              Добавить фото:
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
                            />
                          </div>
                        )}

                        {stage.photoUrls && stage.photoUrls.length > 0 && (
                          <div className="stage-photos-grid-wrap">
                            <p className="stage-photos-meta">Фото ({stage.photoUrls.length}):</p>
                            <div className="stage-photos-grid">
                              {stage.photoUrls.map((photoUrl, idx) => (
                                <div key={idx} className="stage-photo-tile">
                                  <img
                                    src={backendAssetUrl(photoUrl)}
                                    alt={`Stage ${index + 1} photo ${idx + 1}`}
                                    className="stage-photo-image"
                                    onClick={() => openGallery(stage.photoUrls || [], idx)}
                                  />
                                  {role !== 'client' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePhoto(index, photoUrl);
                                      }}
                                      className="stage-photo-delete"
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
                          <p className="stage-photos-empty">Фото пока не добавлено</p>
                        )}
                      </div>

                      <div className="stage-comments-section">
                        {role !== 'client' ? (
                          <>
                            <IonItem lines="none">
                              <IonTextarea
                                label="Комментарий по этапу"
                                labelPlacement="stacked"
                                autoGrow
                                value={stageCommentDrafts[stage.id] || ''}
                                onIonInput={(e) =>
                                  setStageCommentDrafts((prev) => ({
                                    ...prev,
                                    [stage.id]: String(e.detail.value ?? ''),
                                  }))
                                }
                                placeholder="Введите комментарий"
                              />
                            </IonItem>
                            <IonButton size="small" fill="outline" onClick={() => handleSaveStageComment(index)} className="stage-comment-save">
                              Сохранить комментарий
                            </IonButton>
                          </>
                        ) : stage.stageComment ? (
                          <p className="stage-comment-text">
                            <strong>Комментарий:</strong> {stage.stageComment}
                          </p>
                        ) : null}
                      </div>
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
            <IonItem>
              <IonLabel>Тип объекта</IonLabel>
              <IonSelect
                value={editProjectType}
                onIonChange={(e) => setEditProjectType((e.detail.value as 'typical' | 'individual') || 'typical')}
              >
                <IonSelectOption value="typical">Типовой</IonSelectOption>
                <IonSelectOption value="individual">Индивидуальный</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonInput
                label="Площадь (м²)"
                labelPlacement="floating"
                type="number"
                value={editAreaSqm}
                onIonInput={(e) => {
                  const value = String(e.detail.value ?? '');
                  setEditAreaSqm(value === '' ? 0 : Number(value));
                }}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Сметная стоимость (₽)"
                labelPlacement="floating"
                type="number"
                value={editEstimatedCost}
                onIonInput={(e) => {
                  const value = String(e.detail.value ?? '');
                  setEditEstimatedCost(value === '' ? 0 : Number(value));
                }}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Дата начала"
                labelPlacement="floating"
                type="date"
                value={editStartDate}
                onIonInput={(e) => setEditStartDate(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="План сдачи"
                labelPlacement="floating"
                type="date"
                value={editPlannedEndDate}
                onIonInput={(e) => setEditPlannedEndDate(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Фактическая дата сдачи"
                labelPlacement="floating"
                type="date"
                value={editActualEndDate}
                onIonInput={(e) => setEditActualEndDate(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Ссылка на камеру"
                labelPlacement="floating"
                value={editCameraUrl}
                onIonInput={(e) => setEditCameraUrl(String(e.detail.value ?? ''))}
              />
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

        <IonModal
          isOpen={documentPreviewOpen}
          onDidDismiss={() => setDocumentPreviewOpen(false)}
          className="document-preview-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                {documentPreviewDoc && (
                  <IonButton fill="clear" onClick={() => window.open(documentsApi.download(documentPreviewDoc.id), '_blank')}>
                    Скачать файл
                  </IonButton>
                )}
              </IonButtons>
              <IonButtons slot="end">
                <IonButton onClick={() => setDocumentPreviewOpen(false)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>{documentPreviewDoc?.name || 'Документ'}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="document-preview-content">
            {documentPreviewLoading && (
              <div className="ion-text-center ion-padding">
                <IonSpinner name="crescent" />
              </div>
            )}
            {!documentPreviewLoading && documentPreviewMode === 'pdf' && documentPreviewUrl && (
              <iframe
                title="Просмотр документа"
                src={documentPreviewUrl}
                className="document-preview-frame"
              />
            )}
            {!documentPreviewLoading && documentPreviewMode === 'docx' && (
              <div className="document-preview-docx" dangerouslySetInnerHTML={{ __html: documentPreviewHtml }} />
            )}
            {!documentPreviewLoading && documentPreviewMode === 'unsupported' && (
              <div className="ion-padding">
                <p>{documentPreviewError || 'Просмотр этого формата не поддерживается.'}</p>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ProjectDetail;
