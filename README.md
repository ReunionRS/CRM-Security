# CRM Security: PostgreSQL Migration

## Что сделано
- Firebase удалён из клиентской логики.
- Добавлен backend в `server/` (Express + PostgreSQL).
- Реализованы API для:
  - авторизации (`/api/auth/*`)
  - пользователей (`/api/users`)
  - объектов (`/api/projects`)
  - документов (`/api/documents`)
  - фото этапов строительства
- Документы и фото этапов хранятся в `server/uploads/`, метаданные в PostgreSQL.

## Запуск
1. Настройте подключение к Postgres в `server/.env`.
2. Запустите backend:
   - `npm run server:dev`
3. Запустите frontend:
   - `npm run dev`

## Настройки `server/.env`
Пример:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_security
JWT_SECRET=change_me_to_a_long_random_string
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@admin.ru
ADMIN_PASSWORD=admin123
ADMIN_FIO=Администратор
```

При первом старте backend автоматически создаёт таблицы и admin-пользователя.
