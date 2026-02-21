import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  useIonToast,
  IonChip,
  IonSpinner,
} from '@ionic/react';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext';
import { supportApi, usersApi } from '../api/services';
import type { SupportMessage } from '../api/types';
import { ROLE_LABELS } from '../models/Roles';
import LogOut from '../components/LogOut';

const Support: React.FC = () => {
  const { user, role } = useAuth();
  const [present] = useIonToast();

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');

  const [clients, setClients] = useState<Array<{ id: string; fio: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const isClient = role === 'client';

  const loadMessages = async (clientId?: string) => {
    try {
      const data = await supportApi.list(clientId ? { clientUserId: clientId } : undefined);
      setMessages(data);
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка загрузки сообщений',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isClient) {
      loadMessages().catch(() => setLoading(false));
      return;
    }

    const loadClients = async () => {
      try {
        const allUsers = await usersApi.list();
        const onlyClients = allUsers
          .filter((u) => u.role === 'client')
          .map((u) => ({ id: u.id, fio: u.fio || u.email || 'Клиент' }));
        setClients(onlyClients);
        if (onlyClients.length) {
          setSelectedClientId((prev) => prev || onlyClients[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        present({
          message: error instanceof Error ? error.message : 'Ошибка загрузки клиентов',
          duration: 2200,
          color: 'danger',
          position: 'bottom',
        });
        setLoading(false);
      }
    };

    loadClients().catch(() => setLoading(false));
  }, [isClient]);

  useEffect(() => {
    if (isClient) return;
    if (!selectedClientId) return;
    setLoading(true);
    loadMessages(selectedClientId).catch(() => setLoading(false));
  }, [selectedClientId, isClient]);

  useEffect(() => {
    if (isClient) {
      const timer = window.setInterval(() => {
        loadMessages().catch(() => {});
      }, 10000);
      return () => window.clearInterval(timer);
    }

    if (!selectedClientId) return;
    const timer = window.setInterval(() => {
      loadMessages(selectedClientId).catch(() => {});
    }, 10000);
    return () => window.clearInterval(timer);
  }, [isClient, selectedClientId]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const canSend = messageText.trim().length > 0 && !sending && (isClient || Boolean(selectedClientId));

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;

    setSending(true);
    try {
      await supportApi.send({
        messageText: text,
        clientUserId: isClient ? undefined : selectedClientId,
      });
      setMessageText('');
      await loadMessages(isClient ? undefined : selectedClientId);
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка отправки сообщения',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>CRM Строй — Поддержка</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Поддержка</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {!isClient && (
              <IonItem>
                <IonLabel>Клиент</IonLabel>
                <IonSelect value={selectedClientId} onIonChange={(e) => setSelectedClientId(String(e.detail.value || ''))}>
                  {clients.map((client) => (
                    <IonSelectOption key={client.id} value={client.id}>
                      {client.fio}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}

            <div className="support-chat-list ion-margin-top">
              {loading ? (
                <div className="ion-text-center ion-padding">
                  <IonSpinner name="crescent" />
                </div>
              ) : sortedMessages.length === 0 ? (
                <p>Сообщений пока нет.</p>
              ) : (
                sortedMessages.map((msg) => {
                  const own = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`support-message ${own ? 'support-message-own' : ''}`}>
                      <div className="support-message-meta">
                        <strong>{msg.senderFio}</strong>
                        <IonChip color="medium">{ROLE_LABELS[msg.senderRole]}</IonChip>
                        <span>{new Date(msg.createdAt).toLocaleString('ru-RU')}</span>
                      </div>
                      {!isClient && (
                        <div className="support-message-client">Клиент: {msg.clientFio}</div>
                      )}
                      <div className="support-message-text">{msg.messageText}</div>
                    </div>
                  );
                })
              )}
            </div>

            <IonItem className="ion-margin-top">
              <IonTextarea
                label="Сообщение"
                labelPlacement="floating"
                autoGrow
                value={messageText}
                onIonInput={(e) => setMessageText(String(e.detail.value ?? ''))}
              />
            </IonItem>
            <IonButton className="ion-margin-top" expand="block" disabled={!canSend} onClick={handleSend}>
              {sending ? 'Отправка...' : 'Отправить'}
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Support;
