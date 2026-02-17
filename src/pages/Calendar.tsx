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
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import { calendarOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import '../styles/styles.css';
import LogOut from '../components/LogOut';
import { collection, getDocs } from 'firebase/firestore';
import { firestoreBase } from '../firebase/Firebase';
import { CONSTRUCTION_STAGES, type Project } from '../models/Project';
import { useAuth } from '../context/AuthContext';

interface CalendarEvent {
  projectId: string;
  projectAddress: string;
  stageName: string;
  date: string; // YYYY-MM-DD
  type: 'start' | 'end';
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const coll = collection(firestoreBase, 'projects');
      const snap = await getDocs(coll);
      const list: Project[] = snap.docs.map((d) => ({ ...(d.data() as Project), id: d.id })) as any;

      const evs: CalendarEvent[] = [];
      list.forEach((p) => {
        // Клиент видит только свои объекты
        if (role === 'client' && user && p.clientUserId !== user.uid) {
          return;
        }
        (p.stages || []).forEach((s) => {
          if (s.plannedStart) {
            evs.push({
              projectId: p.id!,
              projectAddress: p.constructionAddress || 'Без адреса',
              stageName: s.name,
              date: s.plannedStart,
              type: 'start',
            });
          }
          if (s.plannedEnd) {
            evs.push({
              projectId: p.id!,
              projectAddress: p.constructionAddress || 'Без адреса',
              stageName: s.name,
              date: s.plannedEnd,
              type: 'end',
            });
          }
        });
      });

      setEvents(
        evs.sort((a, b) => (a.date === b.date ? a.stageName.localeCompare(b.stageName) : a.date.localeCompare(b.date)))
      );
      setLoading(false);
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    return Array.from(map.entries()).sort(([d1], [d2]) => d1.localeCompare(d2));
  }, [events]);

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>CRM Строй — Календарь</IonTitle>
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
            ) : grouped.length === 0 ? (
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
                      <IonItem key={idx} routerLink={`/projects/${e.projectId}`}>
                        <IonLabel>
                          <div>{e.stageName}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{e.projectAddress}</div>
                        </IonLabel>
                        <IonChip slot="end" color={e.type === 'start' ? 'primary' : 'secondary'}>
                          {e.type === 'start' ? 'Старт' : 'Сдача'}
                        </IonChip>
                      </IonItem>
                    ))}
                  </React.Fragment>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Calendar;
