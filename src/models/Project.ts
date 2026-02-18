export type ProjectType = 'typical' | 'individual';
export type ProjectStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export const CONSTRUCTION_STAGES = [
  'Фундамент',
  'Обвязка',
  'Каркас стен',
  'Перекрытия',
  'Кровля',
  'Утепление',
  'Наружная отделка',
  'Перегородки',
  'Инженерные коммуникации',
  'Внутренняя отделка',
] as const;

export interface ProjectStage {
  id: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  responsible?: string;
  photoUrls?: string[];
  comments?: string;
  status: StageStatus;
}

export interface Project {
  id?: string;
  clientFio: string;
  clientContacts: string;
  clientEmail?: string;
  clientUserId?: string; // uid пользователя-клиента
  constructionAddress: string;
  projectType: ProjectType;
  areaSqm: number;
  estimatedCost: number;
   // Финансы
  contractAmount?: number; // сумма договора
  paidAmount?: number;     // всего оплачено
  nextPaymentDate?: string; // дата следующего платежа
  lastPaymentDate?: string; // дата последнего платежа
  status: ProjectStatus;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  cameraUrl?: string; // HTTP/HLS/RTSP URL камеры
  stages?: ProjectStage[];
  createdAt?: string;
  updatedAt?: string;
}
