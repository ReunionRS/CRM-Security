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
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  useIonToast,
  IonChip,
  IonSpinner,
  IonIcon,
  IonBadge,
} from '@ionic/react';
import { chevronBackOutline, trashOutline } from 'ionicons/icons';
import '../styles/styles.css';
import { useAuth } from '../context/AuthContext';
import { supportApi } from '../api/services';
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

  const [selectedClientId, setSelectedClientId] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMode, setMobileMode] = useState<'list' | 'chat'>('list');

  const isClient = role === 'client';

  const loadMessages = async () => {
    try {
      const data = await supportApi.list();
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
    setLoading(true);
    loadMessages().catch(() => setLoading(false));
  }, [isClient]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadMessages().catch(() => {});
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const chatList = useMemo(() => {
    if (isClient) return [];
    const map = new Map<string, {
      clientUserId: string;
      clientFio: string;
      lastMessageAt: string;
      lastMessageText: string;
      unreadCount: number;
    }>();
    sortedMessages.forEach((msg) => {
      const existing = map.get(msg.clientUserId);
      const unreadIncrement = msg.senderRole === 'client' && !msg.isReadByAdmin ? 1 : 0;
      if (!existing) {
        map.set(msg.clientUserId, {
          clientUserId: msg.clientUserId,
          clientFio: msg.clientFio,
          lastMessageAt: msg.createdAt,
          lastMessageText: msg.messageText,
          unreadCount: unreadIncrement,
        });
        return;
      }

      if (new Date(msg.createdAt).getTime() > new Date(existing.lastMessageAt).getTime()) {
        existing.lastMessageAt = msg.createdAt;
        existing.lastMessageText = msg.messageText;
      }
      existing.unreadCount += unreadIncrement;
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [sortedMessages, isClient]);

  const selectedChat = useMemo(
    () => chatList.find((chat) => chat.clientUserId === selectedClientId) || null,
    [chatList, selectedClientId]
  );

  useEffect(() => {
    if (isClient) return;
    if (!chatList.length) {
      setSelectedClientId('');
      setMobileMode('list');
      return;
    }
    if (!selectedClientId || !chatList.some((c) => c.clientUserId === selectedClientId)) {
      setSelectedClientId(chatList[0].clientUserId);
    }
  }, [chatList, isClient, selectedClientId]);

  useEffect(() => {
    if (isClient || !selectedClientId) return;
    markChatRead(selectedClientId).catch(() => {});
  }, [selectedClientId, isClient]);

  const visibleMessages = useMemo(() => {
    if (isClient) return sortedMessages;
    if (!selectedClientId) return [];
    return sortedMessages.filter((m) => m.clientUserId === selectedClientId);
  }, [isClient, selectedClientId, sortedMessages]);

  const canSend = messageText.trim().length > 0 && !sending && (isClient || Boolean(selectedClientId));
  const showSidebar = !isClient && (!isMobile || mobileMode === 'list');
  const showChat = isClient || !isMobile || mobileMode === 'chat';

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
      await loadMessages();
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

  const markChatRead = async (clientUserId: string) => {
    if (isClient || !clientUserId) return;
    try {
      await supportApi.markRead(clientUserId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.clientUserId === clientUserId && msg.senderRole === 'client' ? { ...msg, isReadByAdmin: true } : msg
        )
      );
    } catch {
      // silent, polling will sync state later
    }
  };

  const selectChat = (clientUserId: string) => {
    setSelectedClientId(clientUserId);
    markChatRead(clientUserId).catch(() => {});
    if (isMobile) setMobileMode('chat');
  };

  const handleDeleteChat = async () => {
    if (isClient || !selectedClientId) return;
    if (!window.confirm('Удалить весь чат с этим клиентом?')) return;
    try {
      await supportApi.removeChat(selectedClientId);
      setMessages((prev) => prev.filter((msg) => msg.clientUserId !== selectedClientId));
      setSelectedClientId('');
      if (isMobile) setMobileMode('list');
      present({ message: 'Чат удален', duration: 1800, color: 'success', position: 'bottom' });
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Ошибка удаления чата',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
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
          <IonTitle>CRM Строй — Поддержка</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard className="support-card">
          <IonCardHeader>
            <IonCardTitle>Поддержка</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className="support-layout">
            {showSidebar && (
              <div className="support-sidebar">
                <div className="support-sidebar-title">Диалоги</div>
                {loading ? (
                  <div className="ion-text-center ion-padding">
                    <IonSpinner name="crescent" />
                  </div>
                ) : chatList.length === 0 ? (
                  <p className="support-empty">Пока нет обращений</p>
                ) : (
                  <IonList>
                    {chatList.map((chat) => (
                      <IonItem
                        button
                        detail={false}
                        key={chat.clientUserId}
                        className={`support-chat-item${chat.clientUserId === selectedClientId ? ' support-chat-item-active' : ''}`}
                        onClick={() => selectChat(chat.clientUserId)}
                      >
                        <IonLabel>
                          <h3>{chat.clientFio}</h3>
                          <p>{chat.lastMessageText}</p>
                        </IonLabel>
                        {chat.unreadCount > 0 && (
                          <IonBadge color="danger" slot="end">
                            {chat.unreadCount}
                          </IonBadge>
                        )}
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </div>
            )}

            {showChat && (
              <div className="support-main">
                {!isClient && isMobile && (
                  <IonButton fill="clear" size="small" className="support-mobile-back" onClick={() => setMobileMode('list')}>
                    <IonIcon slot="start" icon={chevronBackOutline} />
                    Диалоги
                  </IonButton>
                )}
              {!isClient && selectedChat && (
                <div className="support-chat-header">
                  <div className="support-chat-header-title">{selectedChat.clientFio}</div>
                  <IonButton fill="clear" color="danger" size="small" onClick={handleDeleteChat}>
                    <IonIcon slot="start" icon={trashOutline} />
                    Удалить чат
                  </IonButton>
                </div>
              )}
              <div className="support-chat-list">
                {loading ? (
                  <div className="ion-text-center ion-padding">
                    <IonSpinner name="crescent" />
                  </div>
                ) : visibleMessages.length === 0 ? (
                  <p className="support-empty">{isClient ? 'Сообщений пока нет.' : 'Выберите диалог слева'}</p>
                ) : (
                  visibleMessages.map((msg) => {
                    const own = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`support-message ${own ? 'support-message-own' : ''}`}>
                        <div className="support-message-meta">
                          <strong>{msg.senderFio}</strong>
                          <IonChip color="medium">{ROLE_LABELS[msg.senderRole]}</IonChip>
                          <span>{new Date(msg.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
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
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Support;
