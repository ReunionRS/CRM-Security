import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import LogOut from '../components/LogOut';
import { notificationsApi, usersApi } from '../api/services';
import type { AppUser, StageCommentNotification } from '../api/types';
import { useAuth } from '../context/AuthContext';

function stageIndexFromId(stageId: string): number | null {
  const match = String(stageId || '').match(/stage-(\d+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isInteger(value) ? value : null;
}

const Notifications: React.FC = () => {
  const [present] = useIonToast();
  const history = useHistory();
  const { role } = useAuth();
  const [items, setItems] = useState<StageCommentNotification[]>([]);
  const [clients, setClients] = useState<AppUser[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(true);

  const isClient = role === 'client';
  const unreadCount = useMemo(() => items.filter((x) => !x.isRead).length, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await notificationsApi.list(isClient ? undefined : selectedClientId ? { clientUserId: selectedClientId } : undefined);
      setItems(list);
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка загрузки уведомлений',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [isClient, selectedClientId]);

  useEffect(() => {
    if (isClient) return;
    usersApi
      .list()
      .then((all) => setClients(all.filter((u) => u.role === 'client')))
      .catch(() => {});
  }, [isClient]);

  const openProject = async (n: StageCommentNotification) => {
    if (!n.isRead) {
      await notificationsApi.markRead(n.id).catch(() => {});
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    const index = stageIndexFromId(n.stageId);
    const suffix = index === null ? '' : `?stageIndex=${index}`;
    history.push(`/projects/${n.projectId}${suffix}`);
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead(isClient ? undefined : selectedClientId || undefined);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      present({ message: 'Уведомления отмечены как прочитанные', duration: 1600, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Не удалось отметить уведомления',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  const clearAll = async () => {
    try {
      await notificationsApi.clearAll(isClient ? undefined : selectedClientId || undefined);
      setItems([]);
      present({ message: 'История уведомлений очищена', duration: 1800, position: 'bottom', color: 'success' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Не удалось очистить уведомления',
        duration: 2200,
        position: 'bottom',
        color: 'danger',
      });
    }
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Март Строй — Уведомления</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Уведомления по этапам {unreadCount > 0 ? `(${unreadCount} новых)` : ''}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {!isClient && (
              <IonItem>
                <IonSelect
                  label="Клиент"
                  labelPlacement="stacked"
                  value={selectedClientId}
                  placeholder="Все клиенты"
                  onIonChange={(e) => setSelectedClientId(String(e.detail.value || ''))}
                >
                  <IonSelectOption value="">Все клиенты</IonSelectOption>
                  {clients.map((c) => (
                    <IonSelectOption key={c.id} value={c.id}>
                      {c.fio}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <IonButton fill="outline" size="small" onClick={markAllRead} disabled={!items.length}>
                Отметить все как прочитанные
              </IonButton>
              <IonButton color="danger" fill="outline" size="small" onClick={clearAll} disabled={!items.length}>
                Очистить всё
              </IonButton>
            </div>

            {loading ? (
              <p className="ion-margin-top">Загрузка...</p>
            ) : !items.length ? (
              <p className="ion-margin-top">Пока уведомлений нет.</p>
            ) : (
              <IonList className="ion-margin-top">
                {items.map((n) => (
                  <IonItem key={n.id} button detail onClick={() => openProject(n)} className={!n.isRead ? 'notification-unread' : ''}>
                    <IonLabel>
                      <div><strong>{n.stageName}</strong></div>
                      <div style={{ marginTop: 4 }}>{n.commentText}</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.75, marginTop: 4 }}>
                        {n.projectAddress || 'Объект'} • {new Date(n.createdAt).toLocaleString('ru-RU')}
                      </div>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
