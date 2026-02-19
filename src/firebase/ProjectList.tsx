import React, { useEffect, useState } from 'react';
import { Project, CONSTRUCTION_STAGES } from '../models/Project';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonButton,
  IonLabel,
  IonItem,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, personOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { projectsApi, usersApi } from '../api/services';

interface UserRecord {
  uid: string;
  fio?: string;
  email?: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_progress: 'В работе',
  completed: 'Завершён',
  on_hold: 'Приостановлен',
  cancelled: 'Отменён',
};

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editClientId, setEditClientId] = useState<string>('');
  const [editFio, setEditFio] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [present] = useIonToast();
  const history = useHistory();
  const { role, firestoreUserId } = useAuth();

  const getData = async () => {
    const list = await projectsApi.list();
    setProjects(
      list.map((project) => ({
        ...project,
        stages:
          project.stages ||
          CONSTRUCTION_STAGES.map((name, i) => ({
            id: `stage-${i}`,
            name,
            plannedStart: '',
            plannedEnd: '',
            status: 'not_started' as const,
          })),
      }))
    );
  };

  const getUsers = async () => {
    const list = await usersApi.list();
    setUsers(list.map((u) => ({ uid: u.id, fio: u.fio, email: u.email })));
  };

  useEffect(() => {
    Promise.all([getData(), getUsers()]).catch((error) => {
      present({
        message: error instanceof Error ? error.message : 'Ошибка загрузки',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    });
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Удалить объект?')) return;
    try {
      await projectsApi.remove(id);
      getData();
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка удаления',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    }
  };

  const handleEditClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditClientId(project.clientUserId || '');
    setEditFio(project.clientFio || '');
    setEditPhone(project.clientPhone || project.clientContacts || '');
    setEditEmail(project.clientEmail || '');
    setEditAddress(project.constructionAddress || '');
    setEditStatus(project.status || 'draft');
  };

  const handleSaveEdit = async () => {
    if (!editingProject?.id) return;

    let finalClientId = editClientId;
    if (!finalClientId && editFio) {
      const matchedUser = users.find((u) => u.fio?.toLowerCase() === editFio.toLowerCase());
      if (matchedUser) {
        finalClientId = matchedUser.uid;
      }
    }

    if (finalClientId) {
      const selectedUser = users.find((u) => u.uid === finalClientId);
      if (selectedUser) {
        setEditFio(selectedUser.fio || editFio);
        setEditEmail(selectedUser.email || editEmail);
      }
    }

    try {
      await projectsApi.update(editingProject.id, {
        clientUserId: finalClientId || undefined,
        clientFio: editFio,
        clientPhone: editPhone,
        clientContacts: editPhone,
        clientEmail: editEmail,
        constructionAddress: editAddress,
        status: editStatus as Project['status'],
      });

      setEditingProject(null);
      getData();
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка сохранения',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    }
  };

  const completedCount = (p: Project) => (p.stages || []).filter((s) => s.status === 'completed').length;
  const totalStages = CONSTRUCTION_STAGES.length;
  const progressPercent = (p: Project) => (totalStages ? Math.round((completedCount(p) / totalStages) * 100) : 0);

  const debt = (p: Project) => Math.max((p.contractAmount ?? 0) - (p.paidAmount ?? 0), 0);

  const isPaymentOverdue = (p: Project) => {
    if (!debt(p)) return false;
    if (!p.nextPaymentDate) return false;
    return new Date(p.nextPaymentDate) < new Date();
  };

  const visibleProjects =
    role === 'client' && firestoreUserId
      ? projects.filter((p) => p.clientUserId === firestoreUserId)
      : projects;

  return (
    <div className="project-list">
      {visibleProjects.map((project) => (
        <IonCard key={project.id} button onClick={() => history.push(`/projects/${project.id}`)} className="project-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={locationOutline} className="card-icon" />
              {project.constructionAddress || 'Без адреса'}
            </IonCardTitle>
            <IonChip color={project.status === 'completed' ? 'success' : 'primary'}>
              {STATUS_LABELS[project.status] || project.status}
            </IonChip>
            {debt(project) > 0 && (
              <IonChip color={isPaymentOverdue(project) ? 'danger' : 'warning'}>
                Долг: {debt(project).toLocaleString('ru-RU')} ₽
              </IonChip>
            )}
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="project-meta">
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>{project.clientFio}</IonLabel>
            </IonItem>
            <div className="project-progress">
              <IonLabel>Готовность: {progressPercent(project)}%</IonLabel>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent(project)}%` }} />
              </div>
            </div>
            <div className="project-dates">
              <span>Начало: {project.startDate || '—'}</span>
              <span>План сдачи: {project.plannedEndDate || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {role !== 'client' && (
                <IonButton color="primary" fill="clear" size="small" onClick={(e) => handleEditClick(project, e)}>
                  Редактировать
                </IonButton>
              )}
              {role !== 'client' && (
                <IonButton
                  color="danger"
                  fill="clear"
                  size="small"
                  onClick={(e) => project.id && handleDelete(project.id, e)}
                >
                  Удалить
                </IonButton>
              )}
            </div>
          </IonCardContent>
        </IonCard>
      ))}

      <IonModal isOpen={!!editingProject} onDidDismiss={() => setEditingProject(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Редактировать объект</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setEditingProject(null)}>
              Закрыть
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="edit-form-group">
            <label className="edit-form-label">Клиент</label>
            <IonSelect
              value={editClientId}
              onIonChange={(e) => {
                const selectedId = e.detail.value;
                setEditClientId(selectedId);
                const selectedUser = users.find((u) => u.uid === selectedId);
                if (selectedUser) {
                  setEditFio(selectedUser.fio || '');
                  setEditEmail(selectedUser.email || '');
                }
              }}
            >
              <IonSelectOption value="">Нет привязки</IonSelectOption>
              {users.map((u) => (
                <IonSelectOption key={u.uid} value={u.uid}>
                  {u.fio} ({u.email})
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          <div className="edit-form-group">
            <label className="edit-form-label">ФИО Клиента</label>
            <IonInput value={editFio} onIonChange={(e) => setEditFio(e.detail.value || '')} placeholder="Введите ФИО" />
          </div>

          <div className="edit-form-group">
            <label className="edit-form-label">Телефон</label>
            <IonInput
              value={editPhone}
              onIonChange={(e) => setEditPhone(e.detail.value || '')}
              placeholder="+7..."
            />
          </div>

          <div className="edit-form-group">
            <label className="edit-form-label">Email</label>
            <IonInput
              value={editEmail}
              onIonChange={(e) => setEditEmail(e.detail.value || '')}
              placeholder="Введите email"
              type="email"
            />
          </div>

          <div className="edit-form-group">
            <label className="edit-form-label">Адрес</label>
            <IonInput
              value={editAddress}
              onIonChange={(e) => setEditAddress(e.detail.value || '')}
              placeholder="Введите адрес"
            />
          </div>

          <div className="edit-form-group">
            <label className="edit-form-label">Статус</label>
            <IonSelect value={editStatus} onIonChange={(e) => setEditStatus(e.detail.value)}>
              <IonSelectOption value="draft">Черновик</IonSelectOption>
              <IonSelectOption value="in_progress">В работе</IonSelectOption>
              <IonSelectOption value="completed">Завершён</IonSelectOption>
              <IonSelectOption value="on_hold">Приостановлен</IonSelectOption>
              <IonSelectOption value="cancelled">Отменён</IonSelectOption>
            </IonSelect>
          </div>

          <IonButton expand="block" onClick={handleSaveEdit}>
            Сохранить
          </IonButton>
        </IonContent>
      </IonModal>
    </div>
  );
};

export default ProjectList;
