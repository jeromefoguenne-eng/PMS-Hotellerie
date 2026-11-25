export type Language = 'fr' | 'en';
export type UserRole = 'member' | 'teacher' | 'admin';
export type CurrencyCode = 'FCFA' | 'EUR' | 'USD' | 'GBP' | 'CHF' | 'MAD';
export type RoomStatus = 'available' | 'occupied' | 'dirty' | 'cleaning' | 'inspected' | 'out_of_order';
export type RoomType = 'Standard' | 'Supérieure' | 'Deluxe' | 'Suite' | 'Familiale';
export type ReservationStatus = 'confirmed' | 'waitlist' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type SalesChannel = 'Direct' | 'Téléphone' | 'OTA' | 'Agence' | 'Entreprise';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mobile_money' | 'voucher' | 'room_charge';
export type FolioCategory =
  | 'room'
  | 'restaurant'
  | 'bar'
  | 'room_service'
  | 'minibar'
  | 'housekeeping'
  | 'spa'
  | 'parking'
  | 'extra'
  | 'tax'
  | 'discount';

export type PedagogicalMode = 'learning' | 'exercise' | 'exam' | 'live';

export interface HotelModulesConfig {
  roomService: boolean;
  barAndFood: boolean;
  minibar: boolean;
  housekeepingMode: 'included' | 'optional_guest_choice' | 'disabled';
  breakfastIncluded: boolean;
  onlineCheckIn: boolean;
  spa: boolean;
  parking: boolean;
  inventory: boolean;
  pedagogicalMode: boolean;
}

export interface BillingConfig {
  vatRate: number;
  cityTaxPerNight: number;
  serviceChargeRate: number;
  cancellationPolicy: 'flexible' | '24h' | 'non_refundable';
  allowSplitBilling: boolean;
  allowGroupBilling: boolean;
  allowDiscountsAndCredits: boolean;
  acceptedPayments: PaymentMethod[];
}

export interface RatePlan {
  id: string;
  name: string;
  multiplier: number;
  description: string;
}

export interface HotelConfig {
  hotelName: string;
  categoryStars: number;
  city: string;
  country: string;
  currency: CurrencyCode;
  floors: number;
  totalRooms: number;
  modules: HotelModulesConfig;
  billing: BillingConfig;
  ratePlans: RatePlan[];
  activeChannels: SalesChannel[];
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  baseRate: number;
  status: RoomStatus;
  assignedHousekeeper?: string;
  guestOptedOutHousekeeping?: boolean;
  notes?: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  idNumber: string;
  vipStatus: 'Standard' | 'Silver' | 'Gold' | 'Corporate';
  preferences: string;
  notes: string;
  loyaltyPoints: number;
}

export interface Reservation {
  id: string;
  reference: string;
  guestId: string;
  roomId?: string;
  roomType: RoomType;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  ratePlanId: string;
  channel: SalesChannel;
  status: ReservationStatus;
  guaranteeType: 'card' | 'deposit' | 'prepaid' | 'none';
  depositAmount: number;
  housekeepingChoice: 'included' | 'requested' | 'declined';
  specialRequests: string;
  groupName?: string;
  nightlyRate: number;
}

export interface FolioItem {
  id: string;
  date: string;
  description: string;
  category: FolioCategory;
  quantity: number;
  unitPrice: number;
  payer: 'guest' | 'company';
}

export interface Payment {
  id: string;
  date: string;
  method: PaymentMethod;
  amount: number;
  payer: 'guest' | 'company';
  reference?: string;
}

export interface Folio {
  id: string;
  reservationId: string;
  guestId: string;
  items: FolioItem[];
  payments: Payment[];
  isClosed: boolean;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: 'bar' | 'room_service' | 'minibar' | 'linen' | 'amenities' | 'cleaning';
  unitPrice: number;
  unitCost: number;
  stockQty: number;
  minThreshold: number;
  soldCount: number;
}

export interface MaintenanceTicket {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  reportedAt: string;
}

export interface LostAndFoundItem {
  id: string;
  roomNumber: string;
  description: string;
  foundDate: string;
  status: 'stored' | 'returned';
}

export interface NightAuditLog {
  id: string;
  date: string;
  roomRevenue: number;
  extrasRevenue: number;
  taxesCollected: number;
  discrepancy: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  closedBy: string;
}

export interface PedagogicalProgress {
  mode: PedagogicalMode;
  currentLevel: number;
  score: number;
  badges: string[];
  completedScenarios: string[];
  quizScores: Record<number, number>;
  activeScenarioId?: string;
}

export interface ProjectCollaborator {
  email: string;
  name: string;
  role: 'manager' | 'reception' | 'housekeeping' | 'accounting';
  addedAt: string;
}

export interface ProjectActionLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  category: 'reservation' | 'front_desk' | 'billing' | 'housekeeping' | 'inventory' | 'config' | 'team';
  action: string;
  details: string;
}

export interface HotelProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  simulatedDate: string;
  simulatedTime: string;
  season: 'low' | 'mid' | 'high';
  config: HotelConfig;
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  folios: Folio[];
  catalog: CatalogItem[];
  maintenanceTickets: MaintenanceTicket[];
  lostAndFound: LostAndFoundItem[];
  nightAudits: NightAuditLog[];
  pedagogy: PedagogicalProgress;
  collaborators?: ProjectCollaborator[];
  actionLog?: ProjectActionLog[];
}

export interface TelemetryEvent {
  id: string;
  memberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  type: 'reservation_created' | 'check_in' | 'check_out' | 'item_sold' | 'night_audit' | 'module_toggled' | 'project_created';
  revenueDelta: number;
  roomsDelta: number;
  itemsDelta: number;
  currency: CurrencyCode;
  detail: string;
}

export interface MemberAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  organization: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
  lastActiveAt: string;
  charterAccepted: boolean;
  charterAcceptedAt?: string;
  activeProjectId: string;
  projects: HotelProject[];
}

export interface PedagogicalScenario {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  objectiveFr: string;
  objectiveEn: string;
  stepsFr: string[];
  stepsEn: string[];
  points: number;
  targetTab: string;
}

export interface QuizQuestion {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  questionFr: string;
  questionEn: string;
  optionsFr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationFr: string;
  explanationEn: string;
}
