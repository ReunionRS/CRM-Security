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
} from '@ionic/react';
import '../styles/styles.css';

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

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const ref = doc(firestoreBase, 'projects', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { ...snap.data(), id: snap.id } as Project;
        setProject(data);
        setStages(ensureStages(data));
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
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ProjectDetail;
