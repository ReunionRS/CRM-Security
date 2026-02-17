import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonMenu,
  IonMenuToggle,
  IonRouterLink,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  chevronDownOutline,
  chevronDownSharp,
  documentTextOutline,
  documentTextSharp,
  homeOutline,
  peopleCircleOutline,
  calendarOutline,
  barChartOutline,
} from 'ionicons/icons';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, type UserRole } from '../models/Roles';

const Menu: React.FC = () => {
  const [subMenu, setSubMenu] = useState<Record<string, boolean>>({});
  const { role } = useAuth();

  const toggleSubMenu = (key: string) => {
    setSubMenu((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canSeeUsers = (r: UserRole | null) => r === 'admin' || r === 'director';

  return (
    <IonMenu side="start" contentId="main-content">
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            CRM Строй
            {role && (
              <span style={{ fontSize: '0.75rem', marginLeft: 8, opacity: 0.8 }}>
                ({ROLE_LABELS[role]})
              </span>
            )}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-no-padding">
        <IonItemGroup>
          <IonItemDivider onClick={() => toggleSubMenu('objects')}>
            <IonLabel>Объекты строительства</IonLabel>
            <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp} />
          </IonItemDivider>
          <IonMenuToggle hidden={subMenu.objects} autoHide={false}>
            <IonRouterLink href="/projects">
              <IonItem lines="full" detail>
                <IonIcon slot="start" ios={homeOutline} md={homeOutline} />
                <IonLabel>Объекты</IonLabel>
              </IonItem>
            </IonRouterLink>
          </IonMenuToggle>
        </IonItemGroup>
        <IonItemGroup>
          <IonItemDivider onClick={() => toggleSubMenu('docs')}>
            <IonLabel>Документооборот</IonLabel>
            <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp} />
          </IonItemDivider>
          <IonMenuToggle hidden={subMenu.docs} autoHide={false}>
            <IonRouterLink href="/documents">
              <IonItem lines="full" detail>
                <IonIcon slot="start" ios={documentTextOutline} md={documentTextSharp} />
                <IonLabel>Документы</IonLabel>
              </IonItem>
            </IonRouterLink>
          </IonMenuToggle>
        </IonItemGroup>
        <IonItemGroup>
          <IonItemDivider onClick={() => toggleSubMenu('plan')}>
            <IonLabel>Планирование</IonLabel>
            <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp} />
          </IonItemDivider>
          <IonMenuToggle hidden={subMenu.plan} autoHide={false}>
            <IonRouterLink href="/calendar">
              <IonItem lines="full" detail>
                <IonIcon slot="start" ios={calendarOutline} md={calendarOutline} />
                <IonLabel>Календарь</IonLabel>
              </IonItem>
            </IonRouterLink>
          </IonMenuToggle>
          <IonMenuToggle hidden={subMenu.plan} autoHide={false}>
            <IonRouterLink href="/reports">
              <IonItem lines="full" detail>
                <IonIcon slot="start" ios={barChartOutline} md={barChartOutline} />
                <IonLabel>Отчёты</IonLabel>
              </IonItem>
            </IonRouterLink>
          </IonMenuToggle>
        </IonItemGroup>
        <IonItemGroup>
          <IonItemDivider onClick={() => toggleSubMenu('users')}>
            <IonLabel>Управление</IonLabel>
            <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp} />
          </IonItemDivider>
          {canSeeUsers(role) && (
            <IonMenuToggle hidden={subMenu.users} autoHide={false}>
              <IonRouterLink href="/users">
                <IonItem lines="full" detail>
                  <IonIcon slot="start" ios={peopleCircleOutline} md={peopleCircleOutline} />
                  <IonLabel>Пользователи</IonLabel>
                </IonItem>
              </IonRouterLink>
            </IonMenuToggle>
          )}
        </IonItemGroup>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
