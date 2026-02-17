import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { firestoreBase } from './Firebase';
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
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, personOutline } from 'ionicons/icons';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_progress: 'В работе',
  completed: 'Завершён',
  on_hold: 'Приостановлен',
  cancelled: 'Отменён',
};

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const history = useHistory();
  const coll = collection(firestoreBase, 'projects');

  const getData = async () => {
    const snap = await getDocs(coll);
    setProjects(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          stages: data.stages || CONSTRUCTION_STAGES.map((name, i) => ({
            id: `stage-${i}`,
            name,
            plannedStart: '',
            plannedEnd: '',
            status: 'not_started' as const,
          })),
        } as Project;
      })
    );
  };

  useEffect(() => {
    getData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Удалить объект?')) return;
    await deleteDoc(doc(firestoreBase, 'projects', id));
    getData();
  };

  const completedCount = (p: Project) =>
    (p.stages || []).filter((s) => s.status === 'completed').length;
  const totalStages = CONSTRUCTION_STAGES.length;
  const progressPercent = (p: Project) =>
    totalStages ? Math.round((completedCount(p) / totalStages) * 100) : 0;

  return (
    <div className="project-list">
      {projects.map((project) => (
        <IonCard
          key={project.id}
          button
          onClick={() => history.push(`/projects/${project.id}`)}
          className="project-card"
        >
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={locationOutline} className="card-icon" />
              {project.constructionAddress || 'Без адреса'}
            </IonCardTitle>
            <IonChip color={project.status === 'completed' ? 'success' : 'primary'}>
              {STATUS_LABELS[project.status] || project.status}
            </IonChip>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" className="project-meta">
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>{project.clientFio}</IonLabel>
            </IonItem>
            <div className="project-progress">
              <IonLabel>Готовность: {progressPercent(project)}%</IonLabel>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent(project)}%` }}
                />
              </div>
            </div>
            <div className="project-dates">
              <span>Начало: {project.startDate || '—'}</span>
              <span>План сдачи: {project.plannedEndDate || '—'}</span>
            </div>
            <IonButton
              color="danger"
              fill="clear"
              size="small"
              onClick={(e) => project.id && handleDelete(project.id, e)}
            >
              Удалить
            </IonButton>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );
};

export default ProjectList;
