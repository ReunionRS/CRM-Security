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
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  useIonToast,
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import { calendarOutline, close } from 'ionicons/icons';
import '../styles/styles.css';
import LogOut from '../components/LogOut';
import { type Project, type StageStatus } from '../models/Project';
import { useAuth } from '../context/AuthContext';
import { projectsApi } from '../api/services';

interface CalendarEvent {
  projectId: string;
  projectAddress: string;
  stageName: string;
  stageIndex: number;
  date: string;
  type: 'start' | 'end';
  status: StageStatus;
  plannedStart: string;
  plannedEnd: string;
}

const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  not_started: 'Не начат',
  in_progress: 'В работе',
  completed: 'Завершён',
  overdue: 'Просрочен',
};

const EDITABLE_STAGE_STATUSES: StageStatus[] = ['not_started', 'in_progress', 'completed'];

const Calendar: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [present] = useIonToast();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStatus, setEditStatus] = useState<StageStatus>('not_started');
  const [saving, setSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { role, firestoreUserId } = useAuth();
  const isClient = role === 'client';

  const buildEvents = (list: Project[]): CalendarEvent[] => {
    const evs: CalendarEvent[] = [];

    list.forEach((p: Project) => {
      if (isClient && firestoreUserId && p.clientUserId !== firestoreUserId) {
        return;
      }
      (p.stages || []).forEach((s, stageIndex) => {
        if (s.plannedStart) {
          evs.push({
            projectId: p.id!,
            projectAddress: p.constructionAddress || 'Без адреса',
            stageName: s.name,
            stageIndex,
            date: s.plannedStart,
            type: 'start',
            status: s.status,
            plannedStart: s.plannedStart || '',
            plannedEnd: s.plannedEnd || '',
          });
        }
        if (s.plannedEnd) {
          evs.push({
            projectId: p.id!,
            projectAddress: p.constructionAddress || 'Без адреса',
            stageName: s.name,
            stageIndex,
            date: s.plannedEnd,
            type: 'end',
            status: s.status,
            plannedStart: s.plannedStart || '',
            plannedEnd: s.plannedEnd || '',
          });
        }
      });
    });

    return evs.sort((a, b) => (a.date === b.date ? a.stageName.localeCompare(b.stageName) : a.date.localeCompare(b.date)));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await projectsApi.list();
      setProjects(list);
      setEvents(buildEvents(list));
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [isClient, firestoreUserId]);

  const openEditor = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditStart(event.plannedStart || '');
    setEditEnd(event.plannedEnd || '');
    setEditStatus(event.status || 'not_started');
  };

  const closeEditor = () => {
    setEditingEvent(null);
    setEditStart('');
    setEditEnd('');
    setEditStatus('not_started');
  };

  const saveStageFromCalendar = async () => {
    if (!editingEvent) return;

    setSaving(true);
    try {
      const sourceProject =
        projects.find((p) => p.id === editingEvent.projectId) || (await projectsApi.get(editingEvent.projectId));
      const nextStages = Array.isArray(sourceProject.stages) ? [...sourceProject.stages] : [];
      if (!nextStages[editingEvent.stageIndex]) {
        throw new Error('Этап не найден');
      }

      nextStages[editingEvent.stageIndex] = {
        ...nextStages[editingEvent.stageIndex],
        plannedStart: editStart || '',
        plannedEnd: editEnd || '',
        status: editStatus,
      };

      const updated = await projectsApi.update(editingEvent.projectId, {
        stages: nextStages,
        updatedAt: new Date().toISOString(),
      });

      const nextProjects = projects.map((p) => (p.id === updated.id ? updated : p));
      if (!nextProjects.some((p) => p.id === updated.id)) {
        nextProjects.push(updated);
      }
      setProjects(nextProjects);
      setEvents(buildEvents(nextProjects));
      present({ message: 'Этап обновлён', duration: 1800, position: 'bottom', color: 'success' });
      closeEditor();
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка сохранения этапа',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    return Array.from(map.entries()).sort(([d1], [d2]) => d1.localeCompare(d2));
  }, [events]);

  const adminProjectList = useMemo(() => {
    if (isClient) return [];
    return [...projects]
      .sort((a, b) => {
        const fio = String(a.clientFio || '').localeCompare(String(b.clientFio || ''), 'ru');
        if (fio !== 0) return fio;
        return String(a.constructionAddress || '').localeCompare(String(b.constructionAddress || ''), 'ru');
      });
  }, [projects, isClient]);

  const openProjectStages = (project: Project) => {
    setSelectedProject(project);
  };

  const openEditorFromStage = (project: Project, stageIndex: number) => {
    const stage = (project.stages || [])[stageIndex];
    if (!stage || !project.id) return;
    openEditor({
      projectId: project.id,
      projectAddress: project.constructionAddress || 'Без адреса',
      stageName: stage.name,
      stageIndex,
      date: stage.plannedStart || stage.plannedEnd || '',
      type: 'start',
      status: stage.status,
      plannedStart: stage.plannedStart || '',
      plannedEnd: stage.plannedEnd || '',
    });
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Март Строй — Календарь</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={calendarOutline} className="ion-margin-end" />
              Календарь этапов
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <p>Загрузка...</p>
            ) : isClient ? (
              grouped.length === 0 ? (
                <p>Пока нет дат по этапам. Заполните плановые даты в карточках объектов.</p>
              ) : (
                <IonList>
                  {grouped.map(([date, dayEvents]) => (
                    <React.Fragment key={date}>
                      <IonItem lines="full" color="light">
                        <IonLabel>
                          <strong>{new Date(date).toLocaleDateString('ru-RU')}</strong>
                        </IonLabel>
                      </IonItem>
                      {dayEvents.map((e, idx) => (
                        <IonItem key={idx} button detail onClick={() => openEditor(e)}>
                          <IonLabel>
                            <div>{e.stageName}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{e.projectAddress}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Статус: {STAGE_STATUS_LABELS[e.status] || e.status}</div>
                          </IonLabel>
                          <IonChip slot="end" color={e.type === 'start' ? 'primary' : 'secondary'}>
                            {e.type === 'start' ? 'Старт' : 'Сдача'}
                          </IonChip>
                        </IonItem>
                      ))}
                    </React.Fragment>
                  ))}
                </IonList>
              )
            ) : (
              <IonList>
                {!adminProjectList.length && <p>Пока нет объектов.</p>}
                {adminProjectList.map((p) => (
                  <IonItem key={p.id} button detail onClick={() => openProjectStages(p)}>
                    <IonLabel>
                      <div><strong>{p.clientFio || 'Клиент'}</strong></div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{p.constructionAddress || 'Без адреса'}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Этапов: {(p.stages || []).length}</div>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={!!selectedProject} onDidDismiss={() => setSelectedProject(null)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelectedProject(null)}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>{selectedProject?.clientFio || 'Объект'}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedProject && (
              <>
                <p style={{ marginTop: 0, opacity: 0.8 }}>{selectedProject.constructionAddress || 'Без адреса'}</p>
                <IonList>
                  {(selectedProject.stages || []).map((s, idx) => (
                    <IonItem key={s.id || idx} button detail onClick={() => openEditorFromStage(selectedProject, idx)}>
                      <IonLabel>
                        <div>{s.name}</div>
                        <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>
                          План: {s.plannedStart || '—'} — {s.plannedEnd || '—'}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                          Статус: {STAGE_STATUS_LABELS[s.status] || s.status}
                        </div>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={!!editingEvent} onDidDismiss={closeEditor}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="end">
                <IonButton onClick={closeEditor}>
                  <IonIcon slot="icon-only" icon={close} />
                </IonButton>
              </IonButtons>
              <IonTitle>Редактировать этап</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {editingEvent && (
              <>
                <IonItem lines="none">
                  <IonLabel>
                    <h2>{editingEvent.stageName}</h2>
                    <p>{editingEvent.projectAddress}</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Дата начала этапа"
                    labelPlacement="floating"
                    type="date"
                    value={editStart}
                    onIonInput={(e) => setEditStart(String(e.detail.value ?? ''))}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label="Дата окончания этапа"
                    labelPlacement="floating"
                    type="date"
                    value={editEnd}
                    onIonInput={(e) => setEditEnd(String(e.detail.value ?? ''))}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Статус</IonLabel>
                  <IonSelect value={editStatus} onIonChange={(e) => setEditStatus(e.detail.value as StageStatus)}>
                    {EDITABLE_STAGE_STATUSES.map((status) => (
                      <IonSelectOption key={status} value={status}>
                        {STAGE_STATUS_LABELS[status]}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {EDITABLE_STAGE_STATUSES.map((status) => (
                    <IonButton
                      key={status}
                      size="small"
                      fill={editStatus === status ? 'solid' : 'outline'}
                      onClick={() => setEditStatus(status)}
                    >
                      {STAGE_STATUS_LABELS[status]}
                    </IonButton>
                  ))}
                </div>

                <IonButton className="ion-margin-top" expand="block" onClick={saveStageFromCalendar} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Calendar;
