import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestoreBase } from '../firebase/Firebase';
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
} from '@ionic/react';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext';

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

  const [contractAmount, setContractAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('');
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const ref = doc(firestoreBase, 'projects', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { ...snap.data(), id: snap.id } as Project;
        setProject(data);
        setStages(ensureStages(data));
        setContractAmount(data.contractAmount ?? 0);
        setPaidAmount(data.paidAmount ?? 0);
        setNextPaymentDate(data.nextPaymentDate ?? '');
        setLastPaymentDate(data.lastPaymentDate ?? '');
      }
    };
    load();
  }, [id]);

  const updateStage = async (index: number, patch: Partial<ProjectStage>) => {
    const next = stages.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setStages(next);
    if (!id) return;
    const ref = doc(firestoreBase, 'projects', id);
    await updateDoc(ref, {
      stages: next,
      updatedAt: new Date().toISOString(),
    });
  };

  const markOverdue = (stage: ProjectStage): StageStatus => {
    if (stage.status === 'completed') return 'completed';
    if (isStageOverdue(stage)) return 'overdue';
    return stage.status;
  };

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const progressPercent = CONSTRUCTION_STAGES.length
    ? Math.round((completedCount / CONSTRUCTION_STAGES.length) * 100)
    : 0;

  // Для Gantt: находим общий диапазон дат по этапам
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

  const minTime =
    timeRanges.length > 0 ? Math.min(...timeRanges.map((t) => t.startMs)) : null;
  const maxTime =
    timeRanges.length > 0 ? Math.max(...timeRanges.map((t) => t.endMs)) : null;

  const totalMs =
    minTime !== null && maxTime !== null ? maxTime - minTime || 1 : 1;

  const debt = Math.max((project?.contractAmount ?? contractAmount) - (project?.paidAmount ?? paidAmount), 0);
  const paidPercent =
    (project?.contractAmount ?? contractAmount) > 0
      ? Math.round(
          ((project?.paidAmount ?? paidAmount) / (project?.contractAmount ?? contractAmount)) * 100
        )
      : 0;

  const isPaymentOverdue =
    debt > 0 &&
    (project?.nextPaymentDate ?? nextPaymentDate) &&
    new Date(project?.nextPaymentDate ?? nextPaymentDate) < new Date();

  const canEditFinance =
    role === 'admin' || role === 'director' || role === 'accountant' || role === 'manager';

  const handleSaveFinance = async () => {
    if (!id) return;
    const ref = doc(firestoreBase, 'projects', id);
    await updateDoc(ref, {
      contractAmount,
      paidAmount,
      nextPaymentDate: nextPaymentDate || null,
      lastPaymentDate: lastPaymentDate || null,
      updatedAt: new Date().toISOString(),
    });
    setProject((prev) =>
      prev
        ? {
            ...prev,
            contractAmount,
            paidAmount,
            nextPaymentDate,
            lastPaymentDate,
          }
        : prev
    );
    present({ message: 'Финансы обновлены', duration: 2000, position: 'bottom', color: 'success' });
  };

  if (!project) {
    return (
      <IonPage>
        <IonHeader><IonToolbar><IonTitle>Загрузка...</IonTitle></IonToolbar></IonHeader>
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
            <IonCardTitle>Карточка объекта</IonCardTitle>
            <IonChip color="primary">{STATUS_LABELS[project.status] || project.status}</IonChip>
          </IonCardHeader>
          <IonCardContent>
            <p><strong>ФИО клиента:</strong> {project.clientFio}</p>
            <p><strong>Контакты:</strong> {project.clientContacts || '—'}</p>
            <p><strong>Адрес:</strong> {project.constructionAddress}</p>
            <p><strong>Тип:</strong> {project.projectType === 'typical' ? 'Типовой' : 'Индивидуальный'}</p>
            <p><strong>Площадь:</strong> {project.areaSqm} м²</p>
            <p><strong>Сметная стоимость:</strong> {project.estimatedCost?.toLocaleString('ru-RU')} ₽</p>
            <p><strong>Дата начала:</strong> {project.startDate || '—'}</p>
            <p><strong>План сдачи:</strong> {project.plannedEndDate || '—'}</p>
            {project.actualEndDate && <p><strong>Факт. сдача:</strong> {project.actualEndDate}</p>}
            <div className="project-progress ion-margin-top">
              <IonLabel>Готовность: <strong>{progressPercent}%</strong></IonLabel>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {project.cameraUrl && (
              <div className="ion-margin-top">
                <h3>Камера объекта</h3>
                {project.cameraUrl.startsWith('http') ? (
                  <>
                    <video
                      controls
                      style={{ width: '100%', maxHeight: 320, background: '#000' }}
                      src={project.cameraUrl}
                    >
                      Ваш браузер не поддерживает воспроизведение этого формата.
                    </video>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Ожидается HTTP/HLS поток (например, прокси для RTSP).
                    </p>
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
            <p>
              <strong>Сумма договора:</strong>{' '}
              {(project.contractAmount ?? contractAmount)?.toLocaleString('ru-RU') || 0} ₽
            </p>
            <p>
              <strong>Оплачено:</strong>{' '}
              {(project.paidAmount ?? paidAmount)?.toLocaleString('ru-RU') || '0'} ₽ (
              {paidPercent}%)
            </p>
            <p>
              <strong>Задолженность:</strong> {debt.toLocaleString('ru-RU')} ₽
            </p>
            <p>
              <strong>Дата последнего платежа:</strong>{' '}
              {(project.lastPaymentDate ?? lastPaymentDate) || '—'}
            </p>
            <p>
              <strong>Дата следующего платежа:</strong>{' '}
              {(project.nextPaymentDate ?? nextPaymentDate) || '—'}
            </p>

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
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Этапы строительства</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {stages.map((stage, index) => {
                const displayStatus = markOverdue(stage);
                const isOverdue = displayStatus === 'overdue';
                return (
                  <IonItem key={stage.id} className={isOverdue ? 'stage-overdue' : ''}>
                    <IonLabel>
                      <h2>{stage.name}</h2>
                      <p>
                        План: {stage.plannedStart || '—'} – {stage.plannedEnd || '—'}
                        {stage.actualStart && ` • Факт нач.: ${stage.actualStart}`}
                        {stage.actualEnd && ` • Факт ок.: ${stage.actualEnd}`}
                      </p>
                      {stage.responsible && <p>Ответственный: {stage.responsible}</p>}
                    </IonLabel>
                    <IonChip color={isOverdue ? 'danger' : 'primary'} slot="end">
                      {STAGE_STATUS_LABELS[displayStatus]}
                    </IonChip>
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
                  </IonItem>
                );
              })}
            </IonList>

            {parsedStages.length > 0 && minTime !== null && maxTime !== null && (
              <div className="gantt-container">
                <IonLabel>
                  Диаграмма Gantt (плановые даты):{' '}
                  {new Date(minTime).toLocaleDateString('ru-RU')} –{' '}
                  {new Date(maxTime).toLocaleDateString('ru-RU')}
                </IonLabel>
                {parsedStages.map((s) => {
                  const startOffset =
                    ((s.start.getTime() - minTime) / totalMs) * 100;
                  const width =
                    ((s.end.getTime() - s.start.getTime()) / totalMs) * 100;
                  return (
                    <div key={s.id} className="gantt-row">
                      <div className="gantt-row-label">{s.name}</div>
                      <div className="gantt-bar-track">
                        <div
                          className="gantt-bar"
                          style={{ left: `${startOffset}%`, width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ProjectDetail;
