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
  IonLabel,
  IonList,
  IonItem,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonModal,
  useIonToast,
} from '@ionic/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { chevronBackOutline, chevronForwardOutline, documentTextOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';
import '../styles/styles.css';
import LogOut from '../components/LogOut';
import {
  deleteLocalDocument,
  getLocalDocumentBlob,
  listLocalDocuments,
  saveLocalDocument,
  type LocalDocumentRecord,
} from '../storage/docStore';
import { usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import type { AppUser } from '../api/types';

const DOC_TYPES = [
  'Договор подряда',
  'Приложения к договору',
  'Смета',
  'Акты выполненных работ',
  'Чеки',
  'Гарантийные обязательства',
  'Проектная документация',
];

const isImageDoc = (d: LocalDocumentRecord): boolean => {
  if (d.mimeType?.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(d.fileName);
};

const Documents: React.FC = () => {
  const [present] = useIonToast();
  const { role, user } = useAuth();
  const canUpload = role !== 'client';
  const canDelete = role !== 'client';

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUrlsRef = useRef<Record<string, string>>({});
  const previewDragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number; moved: boolean } | null>(null);

  const [clients, setClients] = useState<AppUser[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [pickedFiles, setPickedFiles] = useState<File[]>([]);
  const [docs, setDocs] = useState<LocalDocumentRecord[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItems, setPreviewItems] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPanX, setPreviewPanX] = useState(0);
  const [previewPanY, setPreviewPanY] = useState(0);

  const toast = (message: string, color: 'success' | 'danger' | 'warning' = 'success') =>
    present({ message, duration: 2200, position: 'bottom', color });

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const reload = async () => {
    if (!selectedClientId) {
      setDocs([]);
      return;
    }
    const list = await listLocalDocuments({ clientUserId: selectedClientId });
    setDocs(list);
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        const list = await usersApi.list();
        const clientList = list.filter((u) => u.role === 'client');
        setClients(clientList);

        if (role === 'client' && user?.id) {
          setSelectedClientId(user.id);
          return;
        }

        if (clientList.length === 1) {
          setSelectedClientId(clientList[0].id);
        }
      } catch {
        toast('Не удалось загрузить клиентов', 'danger');
      }
    };

    loadClients();
  }, [role, user?.id]);

  useEffect(() => {
    reload();
  }, [selectedClientId]);

  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  useEffect(() => {
    return () => {
      Object.values(imageUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const imageDocs = useMemo(() => docs.filter(isImageDoc), [docs]);

  useEffect(() => {
    const imageIds = new Set(imageDocs.map((d) => d.id));
    setImageUrls((prev) => {
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([id, url]) => {
        if (imageIds.has(id)) {
          next[id] = url;
        } else {
          URL.revokeObjectURL(url);
        }
      });
      return next;
    });
  }, [imageDocs]);

  useEffect(() => {
    let active = true;

    const loadMissingPreviews = async () => {
      for (const d of imageDocs) {
        if (imageUrls[d.id]) continue;
        const blob = await getLocalDocumentBlob(d.id);
        if (!active || !blob) continue;

        const url = URL.createObjectURL(blob);
        setImageUrls((prev) => {
          if (prev[d.id]) {
            URL.revokeObjectURL(url);
            return prev;
          }
          return { ...prev, [d.id]: url };
        });
      }
    };

    loadMissingPreviews();
    return () => {
      active = false;
    };
  }, [imageDocs, imageUrls]);

  const handlePickClick = () => fileInputRef.current?.click();

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPickedFiles(files);
  };

  const handleSave = async () => {
    if (!canUpload) {
      toast('Клиенты не могут загружать документы', 'warning');
      return;
    }

    if (!selectedClientId) {
      toast('Сначала выберите клиента', 'warning');
      return;
    }

    if (!pickedFiles.length) {
      toast('Сначала выберите файл', 'warning');
      return;
    }

    try {
      for (const file of pickedFiles) {
        await saveLocalDocument({ clientUserId: selectedClientId, docType, file });
      }
      setPickedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast('Документы сохранены', 'success');
      await reload();
    } catch {
      toast('Ошибка сохранения документов', 'danger');
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    const blob = await getLocalDocumentBlob(id);
    if (!blob) {
      toast('Файл не найден', 'danger');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      toast('Клиенты не могут удалять документы', 'warning');
      return;
    }
    if (!window.confirm('Удалить документ?')) return;
    await deleteLocalDocument(id);
    toast('Удалено', 'success');
    await reload();
  };

  const openPreview = (docId: string) => {
    const items = imageDocs
      .map((d) => ({ id: d.id, name: d.fileName, url: imageUrls[d.id] }))
      .filter((x) => Boolean(x.url)) as Array<{ id: string; name: string; url: string }>;

    if (!items.length) {
      toast('Превью ещё загружается', 'warning');
      return;
    }

    const index = Math.max(
      0,
      items.findIndex((x) => x.id === docId)
    );

    setPreviewItems(items);
    setPreviewIndex(index);
    setPreviewZoom(1);
    setPreviewPanX(0);
    setPreviewPanY(0);
    setPreviewOpen(true);
  };

  const prevPreview = () => {
    if (!previewItems.length) return;
    setPreviewIndex((prev) => (prev - 1 + previewItems.length) % previewItems.length);
  };

  const nextPreview = () => {
    if (!previewItems.length) return;
    setPreviewIndex((prev) => (prev + 1) % previewItems.length);
    setPreviewPanX(0);
    setPreviewPanY(0);
  };

  const zoomInPreview = () => setPreviewZoom((prev) => Math.min(prev + 0.25, 4));
  const zoomOutPreview = () =>
    setPreviewZoom((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) {
        setPreviewPanX(0);
        setPreviewPanY(0);
      }
      return next;
    });

  const handlePreviewPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    if (previewZoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    previewDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: previewPanX,
      baseY: previewPanY,
      moved: false,
    };
  };

  const handlePreviewPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    const drag = previewDragRef.current;
    if (!drag || previewZoom <= 1) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.moved = true;
    }
    setPreviewPanX(drag.baseX + dx);
    setPreviewPanY(drag.baseY + dy);
  };

  const handlePreviewPointerUp = (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const drag = previewDragRef.current;
    previewDragRef.current = null;
    if (!drag?.moved && previewItems.length > 1) {
      nextPreview();
    }
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Март Строй — Документы</IonTitle>
          <LogOut />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Документооборот</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonSelect
                  label="Клиент"
                  labelPlacement="stacked"
                  value={selectedClientId}
                  onIonChange={(e) => setSelectedClientId(String(e.detail.value || ''))}
                  disabled={role === 'client'}
                  placeholder="Выберите клиента"
                  aria-label="Клиент"
                >
                  {clients.map((c) => (
                    <IonSelectOption key={c.id} value={c.id}>
                      {c.fio}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              {canUpload && (
                <>
                  <IonItem>
                    <IonSelect
                      label="Тип документа"
                      labelPlacement="stacked"
                      value={docType}
                      onIonChange={(e) => setDocType(String(e.detail.value))}
                      aria-label="Тип документа"
                    >
                      {DOC_TYPES.map((t) => (
                        <IonSelectOption key={t} value={t}>
                          {t}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      {pickedFiles.length > 0 ? (
                        <>
                          <strong>Выбрано файлов:</strong> {pickedFiles.length}
                        </>
                      ) : (
                        'Файлы не выбраны'
                      )}
                    </IonLabel>
                    <IonButton slot="end" fill="outline" onClick={handlePickClick} className="choose-files-button">
                      Выбрать файлы
                    </IonButton>
                    <input
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handlePick}
                    />
                  </IonItem>
                  <IonItem lines="none">
                    <IonButton expand="block" onClick={handleSave}>
                      Сохранить документы
                    </IonButton>
                  </IonItem>
                </>
              )}
            </IonList>

            {!canUpload && (
              <p className="ion-margin-top">Клиенты могут только просматривать и скачивать документы.</p>
            )}

            <IonCard className="ion-margin-top">
              <IonCardHeader>
                <IonCardTitle>
                  Документы{selectedClient ? ` — ${selectedClient.fio}` : ''}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {!selectedClientId ? (
                  <p>Выберите клиента.</p>
                ) : docs.length === 0 ? (
                  <p>Пока нет документов.</p>
                ) : (
                  <IonList>
                    {docs.map((d) => (
                      <IonItem key={d.id} className="documents-item">
                        <IonIcon icon={documentTextOutline} slot="start" />
                        <IonLabel className="documents-item-label">
                          <strong className="documents-doc-type">{d.docType}</strong>
                          <div className="documents-doc-name">{d.fileName}</div>
                          <div className="documents-doc-meta">
                            v{d.version} • {(d.size / 1024).toFixed(1)} KB • {new Date(d.uploadedAt).toLocaleString('ru-RU')}
                          </div>
                          <div className="documents-item-actions">
                            {isImageDoc(d) && (
                              <IonButton fill="clear" size="small" onClick={() => openPreview(d.id)}>
                                Просмотр
                              </IonButton>
                            )}
                            <IonButton fill="clear" size="small" onClick={() => handleDownload(d.id, d.fileName)}>
                              Скачать
                            </IonButton>
                            {canDelete && (
                              <IonButton color="danger" fill="clear" size="small" onClick={() => handleDelete(d.id)}>
                                Удалить
                              </IonButton>
                            )}
                          </div>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>
          </IonCardContent>
        </IonCard>

        <IonModal isOpen={previewOpen} onDidDismiss={() => setPreviewOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {previewItems.length ? `${previewIndex + 1}/${previewItems.length} • ${previewItems[previewIndex]?.name || ''}` : 'Превью'}
              </IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {previewItems.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', gap: '12px' }}>
                <IonButton fill="clear" onClick={prevPreview}>
                  <IonIcon icon={chevronBackOutline} />
                </IonButton>
                <div>
                  <img
                    src={previewItems[previewIndex].url}
                    alt={previewItems[previewIndex].name}
                    onPointerDown={handlePreviewPointerDown}
                    onPointerMove={handlePreviewPointerMove}
                    onPointerUp={handlePreviewPointerUp}
                    onPointerCancel={handlePreviewPointerUp}
                    style={{
                      width: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      background: '#111',
                      borderRadius: '10px',
                      transform: `translate(${previewPanX}px, ${previewPanY}px) scale(${previewZoom})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease',
                      cursor: previewZoom > 1 ? 'grab' : 'pointer',
                      touchAction: previewZoom > 1 ? 'none' : 'auto',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
                    <IonButton size="small" onClick={zoomOutPreview} disabled={previewZoom <= 1}>
                      -
                    </IonButton>
                    <IonButton size="small" onClick={() => setPreviewZoom(1)}>
                      100%
                    </IonButton>
                    <IonButton size="small" onClick={zoomInPreview} disabled={previewZoom >= 4}>
                      +
                    </IonButton>
                  </div>
                </div>
                <IonButton fill="clear" onClick={nextPreview}>
                  <IonIcon icon={chevronForwardOutline} />
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Documents;
