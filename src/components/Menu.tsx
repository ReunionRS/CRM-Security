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
  IonButton,
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
  moon,
  sunny,
} from 'ionicons/icons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, type UserRole } from '../models/Roles';

const Menu: React.FC = () => {
  const [subMenu, setSubMenu] = useState<Record<string, boolean>>({});
  const { role, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkMode(dark);
    applyTheme(dark);

    // Add touch support for theme toggle button
    const themeButton = document.querySelector('.theme-toggle-button');
    if (themeButton) {
      const handleTouchStart = (e: Event) => {
        e.preventDefault();
      };
      themeButton.addEventListener('touchstart', handleTouchStart, { passive: false });
      return () => themeButton.removeEventListener('touchstart', handleTouchStart);
    }
  }, []);

  const toggleSubMenu = (key: string) => {
    setSubMenu((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canSeeUsers = (r: UserRole | null) => r === 'admin' || r === 'director';

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('ion-palette-dark');
    } else {
      document.documentElement.classList.remove('ion-palette-dark');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    applyTheme(newDarkMode);
  };

  return (
    <IonMenu side="start" contentId="main-content">
      <IonHeader>
        <IonToolbar>
          <div slot="start" className="menu-header">
            <img src="/img/logo.png" alt="Logo" className="menu-logo" />
            <div className="menu-title">
              <h2>CRM Строй</h2>
              {role && <span className="menu-role">{ROLE_LABELS[role]}</span>}
            </div>
          </div>
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
        {/* Документы доступны всем ролям, включая клиентов */}
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

        {/* Планирование и отчёты скрываем для клиентов */}
        {role !== 'client' && (
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
        )}
        {/* Управление пользователями скрыто для клиентов */}
        {role !== 'client' && (
          <IonItemGroup>
            <IonItemDivider onClick={() => toggleSubMenu('users')}>
              <IonLabel>Управление</IonLabel>
              <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp} />
            </IonItemDivider>
            <IonMenuToggle hidden={subMenu.users} autoHide={false}>
              <IonRouterLink href="/users">
                <IonItem lines="full" detail disabled={!loading && !canSeeUsers(role)}>
                  <IonIcon slot="start" ios={peopleCircleOutline} md={peopleCircleOutline} />
                  <IonLabel>
                    Пользователи{!loading && !canSeeUsers(role) ? ' (нет доступа)' : ''}
                  </IonLabel>
                </IonItem>
              </IonRouterLink>
            </IonMenuToggle>
          </IonItemGroup>
        )}
      </IonContent>
      <div className="menu-footer">
        <IonButton 
          fill="solid" 
          expand="block" 
          color="primary" 
          onClick={toggleTheme}
          type="button"
          className="theme-toggle-button"
        >
          <IonIcon slot="start" icon={isDarkMode ? sunny : moon} />
          <span>{isDarkMode ? 'Светлая тема' : 'Тёмная тема'}</span>
        </IonButton>
      </div>
    </IonMenu>
  );
};

export default Menu;
