export type ProjectType = 'typical' | 'individual';
export type ProjectStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

export type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export const CONSTRUCTION_STAGES = [
  'Фундамент (Согласно смете)',
  'Каркас строения (Согласно смете)',
  'Наружняя обшивка (Согласно смете)',
  'Внутренняя обшивка (Согласно смете)',
  'Кровля (Согласно смете)',
  'Окна и двери (Согласно смете)',
  'Коммуникации (Согласно смете)',
] as const;

export const STAGE_DESCRIPTION_ITEMS: Record<(typeof CONSTRUCTION_STAGES)[number], string[]> = {
  'Фундамент (Согласно смете)': ['Ж/Б Сваи', 'Обвязка свай', 'ОСБ', 'Сетка от грызунов'],
  'Каркас строения (Согласно смете)': [
    'Деревянный каркас - брус (Камерной сушки)',
    'Половые лаги (Камерной сушки)',
    'Поперечные лаги доска (Камерной сушки)',
    'Потолочные лаги выполнены из доски обрезной (Камерной сушки)',
    'Обработка Огнебиозащитой (2 степени, Невымываемый)',
  ],
  'Наружняя обшивка (Согласно смете)': [
    'Монтаж обшивки',
    'Утеплитель КНАУФ или его Аналог не горючий (плотность 22кг/м).',
    'Утепление по наружным плоскостям (стены)',
    'Утепление по наружным плоскостям (Пол/потолок)',
    'Пароизоляция: Пленки ISOBOX отражающая терма.',
    'Ветровлагозащита: Пленки ISOBOX мембрана диффузионная Наружнее закрывание углов',
    'Доборы',
  ],
  'Внутренняя обшивка (Согласно смете)': [
    'Отделка внутренних стен',
    'Гипсакартон влагостойкий Knauf',
    'Пол: Труба из сшитого полиэтилена для системы теплого пола',
    'Ростерм: Фанера',
    'Перегородки',
    'Потолок',
    'Внутреннее закрывание углов',
  ],
  'Кровля (Согласно смете)': [
    'Монтаж крыши на дом: цвет на выбор (Стандартная палитра )',
    'Коньковые элементы',
    'Формирование карниза и подшив его софитом перфориванным',
    'Установка сливной системы,',
    'Монтаж пленки гидроизоляции на кровлю (мембранного типа в случае кровли МАНСАРДНОГО типа)',
    'Монтаж бруска вентзазора',
    'Обработка древесины огнебиозащитой 2 степени (невымываемый)',
    'Подшив перекрытия бруском и пароизоляционнойпленкой',
  ],
  'Окна и двери (Согласно смете)': [
    'Пятикамерный профиль, Двухкамерный стеклопакет, Наружная ламинация цвет',
    'Монтаж окон 70мм профиль',
    'Пятикамерный профиль (По наличию на усмотрение подрядчика)',
    'Отливы и откосы наружные (При наличии отделки фасада)',
    'Фурнитура',
    'Двухкамерный стеклопакет',
    'Ламинация со стороны фасада',
    'Мультифункциональный стеклопакет',
    'Дверь входная',
  ],
  'Коммуникации (Согласно смете)': [
    'Клапан Вентиляции КИВ',
    'Комплект активной вентиляции кровли',
    'Монтаж электропроводки с подключением щита распределительного',
    'Монтаж электрокотла',
    'Монтаж насоса циркуляционого',
    'Монтаж расширительного бака',
    'Монтаж электроводонагревателя',
    'Трубы ПВХ',
    'Обустройство котельной с подключением оборудования',
    'Разводка труб ХВС и ГВС',
  ],
};

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

export function getDefaultConstructionStages(): ProjectStage[] {
  return CONSTRUCTION_STAGES.map((name, i) => ({
    id: `stage-${i}`,
    name,
    plannedStart: '',
    plannedEnd: '',
    comments: STAGE_DESCRIPTION_ITEMS[name].join('\n'),
    status: 'not_started',
  }));
}

export interface Project {
  id?: string;
  clientFio: string;
  clientContacts: string;
  clientPhone?: string;
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
