export type UserRole =
  | 'admin'
  | 'director'
  | 'foreman'
  | 'manager'
  | 'accountant'
  | 'client';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  director: 'Руководитель',
  foreman: 'Прораб',
  manager: 'Менеджер по продажам',
  accountant: 'Бухгалтер',
  client: 'Клиент',
};

export const INTERNAL_ROLES: UserRole[] = ['admin', 'director', 'foreman', 'manager', 'accountant'];

export const DEFAULT_ROLE: UserRole = 'manager';

