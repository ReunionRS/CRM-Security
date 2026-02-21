# CRM Security

CRM для строительных проектов: объекты, этапы строительства, финансы, пользователи и документооборот.

Проект состоит из:
- фронтенда на `Ionic React + Vite` (`/src`)
- бэкенда на `Express + PostgreSQL` (`/server`)
- хранения файлов (документы, фото этапов) на диске сервера в `server/uploads`

## Возможности
- Авторизация и роли пользователей (`admin`, `director`, `manager`, `foreman`, `client`)
- Управление объектами строительства
- Этапы строительства и фото этапов
- Документы по объектам (загрузка/скачивание по правам)
- Хранение метаданных в PostgreSQL
- PWA-сборка
- Android-сборка через Capacitor

## Технологии
- Frontend: `React 18`, `Ionic 7`, `Vite`, `TypeScript`
- Backend: `Node.js`, `Express`, `pg`, `JWT`, `multer`
- База: `PostgreSQL`
- Mobile: `Capacitor Android`

## Структура проекта
- `src` — клиентское приложение
- `server/src/index.js` — API сервер
- `server/src/schema.sql` — схема БД
- `server/uploads/documents` — загруженные документы
- `server/uploads/stage-photos` — фото этапов
- `android` — Android-проект Capacitor

## Требования
- Node.js 18+
- PostgreSQL 14+
- npm 9+

Для Android APK:
- Android Studio
- JDK 17
- Android SDK

## Быстрый запуск локально

### 1) Установка зависимостей
```bash
npm install
npm --prefix server install
```

### 2) Настройка backend
Создайте `server/.env`:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_security
JWT_SECRET=change_me_to_a_long_random_string
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@admin.ru
ADMIN_PASSWORD=admin123
ADMIN_FIO=Администратор
```

При первом запуске сервер:
- создаст таблицы из `server/src/schema.sql`
- создаст администратора, если его нет

### 3) Запуск backend
```bash
npm run server:dev
```

### 4) Запуск frontend
```bash
npm run dev
```

По умолчанию frontend использует API:
- `http://localhost:4000/api`

Если нужно изменить API URL, задайте:
- `VITE_API_URL` (например `https://your-domain.ru/api`)

## Основные npm-скрипты
- `npm run dev` — фронтенд (dev)
- `npm run build` — production build фронтенда
- `npm run preview` — просмотр production build
- `npm run server:dev` — бэкенд
- `npm run server:start` — бэкенд (start)
- `npm run test.unit` — unit-тесты
- `npm run test.e2e` — e2e тесты (cypress)
- `npm run lint` — eslint

## API (кратко)
- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET/POST/DELETE /api/users`
- `GET/POST/PATCH/DELETE /api/projects`
- `GET/POST/DELETE /api/documents`
- `GET /api/documents/:id/download`
- `POST /api/projects/:id/stages/:stageIndex/photos`
- `DELETE /api/projects/:id/stages/:stageIndex/photos`

## PWA
PWA включена через `vite-plugin-pwa`.

Сборка:
```bash
npm run build
```

В `dist` генерируются:
- `manifest.webmanifest`
- `sw.js`

## Android APK (debug)

### 1) Первичная подготовка
```bash
npm run build
npm run android:add
npm run cap:sync
```

### 2) Сборка APK
```bash
npm run apk:debug
```

APK:
- `android/app/build/outputs/apk/debug/app-debug.apk`

Важно:
- для сборки используйте JDK 17
- если backend не на телефоне, не оставляйте `localhost` в `VITE_API_URL`

## Деплой на VPS (кратко)
1. Развернуть PostgreSQL и Node.js
2. Скопировать проект
3. Настроить `server/.env` (production)
4. Запустить backend через `pm2`/`systemd`
5. Настроить `nginx`:
   - фронт из `dist`
   - прокси `/api` на `127.0.0.1:4000`
   - прокси `/uploads` на `127.0.0.1:4000/uploads`
6. Подключить домен
7. Выпустить SSL через Let’s Encrypt (`certbot --nginx`)

## Частые проблемы
- `Failed to fetch` на Android:
  - обычно неверный `VITE_API_URL` (нельзя `localhost`, если API не на телефоне)
- Ошибка push в GitHub по лимиту 100MB:
  - не коммитьте локальные SDK/JDK архивы (`.local-jdks`)
- SSL не выпускается:
  - домен должен быть зарегистрирован и делегирован в публичном DNS

## Лицензия
В репозитории не задана отдельная лицензия.
