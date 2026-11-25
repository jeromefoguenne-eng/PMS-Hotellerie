import type {
  CurrencyCode,
  HotelProject,
  MemberAccount,
  Room,
  RoomType,
  TelemetryEvent,
} from '../types/pms';

export function buildRooms(totalRooms: number, floors: number, currency: CurrencyCode): Room[] {
  const types: RoomType[] = ['Standard', 'Standard', 'Supérieure', 'Deluxe', 'Suite'];
  const baseRatesFCFA: Record<RoomType, number> = {
    Standard: 45000,
    Supérieure: 65000,
    Deluxe: 85000,
    Suite: 135000,
    Familiale: 95000,
  };
  const baseRatesEUR: Record<RoomType, number> = {
    Standard: 95,
    Supérieure: 130,
    Deluxe: 175,
    Suite: 280,
    Familiale: 195,
  };

  const rooms: Room[] = [];
  const perFloor = Math.max(1, Math.ceil(totalRooms / floors));

  for (let i = 0; i < totalRooms; i++) {
    const floor = Math.min(floors, Math.floor(i / perFloor) + 1);
    const indexOnFloor = (i % perFloor) + 1;
    const number = `${floor}${indexOnFloor.toString().padStart(2, '0')}`;
    const type = types[i % types.length];
    const rate = currency === 'FCFA' ? baseRatesFCFA[type] : baseRatesEUR[type];
    const isSuiteOrDeluxe = type === 'Suite' || type === 'Deluxe';
    const isFamily = type === 'Familiale';

    rooms.push({
      id: `room-${number}`,
      number,
      floor,
      type,
      baseRate: rate,
      maxGuests: isFamily ? 4 : isSuiteOrDeluxe ? 3 : 2,
      singleBeds: isFamily ? 2 : type === 'Standard' && i % 2 === 1 ? 2 : 0,
      doubleBeds: isFamily ? 1 : type === 'Standard' && i % 2 === 1 ? 0 : 1,
      amenities: isSuiteOrDeluxe
        ? ['Douche', 'Baignoire', 'Coffre-fort', 'Climatisation', 'Balcon', 'Wi-Fi']
        : ['Douche', 'Coffre-fort', 'Climatisation', 'Wi-Fi'],
      status: i === 3 ? 'dirty' : i === 7 ? 'out_of_order' : 'available',
      assignedHousekeeper: i % 2 === 0 ? 'Amina K.' : 'Clarisse D.',
    });
  }
  return rooms;
}

export function createCotonouProject(id = 'proj-cotonou-1'): HotelProject {
  const today = '2026-11-25';
  const rooms = buildRooms(12, 2, 'FCFA');
  rooms[0].status = 'occupied'; // 101
  rooms[1].status = 'occupied'; // 102
  rooms[2].status = 'inspected'; // 103
  rooms[4].status = 'occupied'; // 105

  return {
    id,
    name: 'Hôtel Le Palmier — Cotonou (Démo Bénin)',
    createdAt: '2026-11-20T09:00:00Z',
    updatedAt: '2026-11-25T08:00:00Z',
    simulatedDate: today,
    simulatedTime: '09:30',
    season: 'mid',
    config: {
      hotelName: 'Hôtel Le Palmier',
      categoryStars: 4,
      city: 'Cotonou',
      country: 'Bénin',
      currency: 'FCFA',
      floors: 2,
      totalRooms: 12,
      modules: {
        roomService: true,
        barAndFood: true,
        minibar: true,
        housekeepingMode: 'optional_guest_choice',
        breakfastIncluded: true,
        onlineCheckIn: true,
        spa: true,
        parking: true,
        inventory: true,
        pedagogicalMode: true,
      },
      billing: {
        vatRate: 18,
        cityTaxPerNight: 1500,
        serviceChargeRate: 5,
        cancellationPolicy: '24h',
        allowSplitBilling: true,
        allowGroupBilling: true,
        allowDiscountsAndCredits: true,
        acceptedPayments: ['cash', 'card', 'mobile_money', 'transfer', 'voucher', 'room_charge'],
      },
      ratePlans: [
        { id: 'rp-public', name: 'Tarif Public', multiplier: 1.0, description: 'Tarif standard flexible' },
        { id: 'rp-corp', name: 'Tarif Entreprise', multiplier: 0.85, description: 'Remise -15% sociétés partenaires' },
        { id: 'rp-wknd', name: 'Forfait Week-end', multiplier: 0.9, description: 'Séjour vendredi-dimanche' },
        { id: 'rp-high', name: 'Haute Saison', multiplier: 1.25, description: 'Période de forte demande' },
      ],
      activeChannels: ['Direct', 'Téléphone', 'OTA', 'Agence', 'Entreprise'],
      customAmenities: ['Douche', 'Baignoire', 'Salle de bain privée', 'Coffre-fort', 'Climatisation', 'Wi-Fi', 'Balcon', 'Vue mer', 'TV Smart', 'Bureau'],
      packages: [
        { id: 'pkg-bf', name: 'Formule Petit-Déjeuner Buffet', category: 'breakfast', price: 8500, pricingUnit: 'per_person_per_night', description: 'Buffet chaud & froid, jus frais', active: true },
        { id: 'pkg-spa', name: 'Accès Spa & Bien-être', category: 'spa', price: 25000, pricingUnit: 'per_stay', description: 'Accès sauna, hammam et piscine', active: true },
        { id: 'pkg-hp', name: 'Formule Demi-Pension', category: 'dining', price: 22000, pricingUnit: 'per_person_per_night', description: 'Petit-déjeuner + dîner 3 plats', active: true },
        { id: 'pkg-airport', name: 'Navette Aéroport VIP', category: 'transport', price: 15000, pricingUnit: 'per_stay', description: 'Transfert privé aller-retour', active: true },
      ],
    },
    rooms,
    guests: [
      {
        id: 'g-1',
        firstName: 'Kofi',
        lastName: 'Mensah',
        email: 'k.mensah@uemoa-corp.bj',
        phone: '+229 97 12 34 56',
        nationality: 'Béninoise',
        idNumber: 'BJ-9948210',
        vipStatus: 'Corporate',
        preferences: 'Chambre calme, facturation entreprise',
        notes: 'Client régulier séminaires',
        loyaltyPoints: 420,
      },
      {
        id: 'g-2',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        email: 'sarah.jenkins@globalngo.org',
        phone: '+44 7700 900123',
        nationality: 'Britannique',
        idNumber: 'UK-5520193',
        vipStatus: 'Gold',
        preferences: 'English speaking, high floor, non-smoking',
        notes: 'Late check-out requested',
        loyaltyPoints: 890,
      },
      {
        id: 'g-3',
        firstName: 'Marc',
        lastName: 'Dubois',
        email: 'marc.dubois@hech.be',
        phone: '+32 475 88 12 09',
        nationality: 'Belge',
        idNumber: 'BE-3319022',
        vipStatus: 'Silver',
        preferences: 'Ménage éco-responsable optionnel',
        notes: 'Mission académique LabDra',
        loyaltyPoints: 210,
      },
      {
        id: 'g-4',
        firstName: 'Aïcha',
        lastName: 'Diallo',
        email: 'aicha.diallo@senegal-tours.sn',
        phone: '+221 77 450 22 11',
        nationality: 'Sénégalaise',
        idNumber: 'SN-7782104',
        vipStatus: 'Standard',
        preferences: 'Petit-déjeuner sans gluten',
        notes: '',
        loyaltyPoints: 90,
      },
    ],
    reservations: [
      {
        id: 'res-1',
        reference: 'OPMS-2601',
        guestId: 'g-1',
        roomId: 'room-101',
        roomType: 'Standard',
        checkIn: '2026-11-23',
        checkOut: '2026-11-26',
        adults: 1,
        children: 0,
        ratePlanId: 'rp-corp',
        channel: 'Entreprise',
        status: 'checked_in',
        guaranteeType: 'card',
        depositAmount: 0,
        housekeepingChoice: 'included',
        specialRequests: 'Facture scindée entreprise',
        nightlyRate: 38250,
      },
      {
        id: 'res-2',
        reference: 'OPMS-2602',
        guestId: 'g-2',
        roomId: 'room-102',
        roomType: 'Standard',
        checkIn: '2026-11-24',
        checkOut: '2026-11-25',
        adults: 1,
        children: 0,
        ratePlanId: 'rp-public',
        channel: 'OTA',
        status: 'checked_in',
        guaranteeType: 'prepaid',
        depositAmount: 45000,
        housekeepingChoice: 'declined',
        specialRequests: 'Eco housekeeping opt-out',
        nightlyRate: 45000,
      },
      {
        id: 'res-3',
        reference: 'OPMS-2603',
        guestId: 'g-3',
        roomId: 'room-103',
        roomType: 'Supérieure',
        checkIn: '2026-11-25',
        checkOut: '2026-11-28',
        adults: 1,
        children: 0,
        ratePlanId: 'rp-corp',
        channel: 'Direct',
        status: 'confirmed',
        guaranteeType: 'card',
        depositAmount: 0,
        housekeepingChoice: 'requested',
        specialRequests: 'Arrivée prévue 14h00',
        nightlyRate: 55250,
      },
      {
        id: 'res-4',
        reference: 'OPMS-2604',
        guestId: 'g-4',
        roomId: 'room-106',
        roomType: 'Standard',
        checkIn: '2026-11-25',
        checkOut: '2026-11-27',
        adults: 2,
        children: 0,
        ratePlanId: 'rp-public',
        channel: 'Téléphone',
        status: 'confirmed',
        guaranteeType: 'deposit',
        depositAmount: 25000,
        housekeepingChoice: 'included',
        specialRequests: 'Lit double',
        nightlyRate: 45000,
      },
      {
        id: 'res-5',
        reference: 'OPMS-2605',
        guestId: 'g-1',
        roomId: 'room-105',
        roomType: 'Suite',
        checkIn: '2026-11-24',
        checkOut: '2026-11-27',
        adults: 2,
        children: 0,
        ratePlanId: 'rp-corp',
        channel: 'Entreprise',
        status: 'checked_in',
        guaranteeType: 'card',
        depositAmount: 0,
        housekeepingChoice: 'included',
        specialRequests: 'Délégation UEMOA',
        groupName: 'Séminaire UEMOA',
        nightlyRate: 114750,
      },
    ],
    folios: [
      {
        id: 'fol-1',
        reservationId: 'res-1',
        guestId: 'g-1',
        isClosed: false,
        items: [
          { id: 'fi-1', date: '2026-11-23', description: 'Nuitée Chambre 101 (x3)', category: 'room', quantity: 3, unitPrice: 38250, payer: 'company' },
          { id: 'fi-2', date: '2026-11-24', description: 'Cocktail Palmier (Bar)', category: 'bar', quantity: 2, unitPrice: 4500, payer: 'guest' },
          { id: 'fi-3', date: '2026-11-25', description: 'Taxe de séjour (x3)', category: 'tax', quantity: 3, unitPrice: 1500, payer: 'company' },
        ],
        payments: [],
      },
      {
        id: 'fol-2',
        reservationId: 'res-2',
        guestId: 'g-2',
        isClosed: false,
        items: [
          { id: 'fi-4', date: '2026-11-24', description: 'Nuitée Chambre 102', category: 'room', quantity: 1, unitPrice: 45000, payer: 'guest' },
          { id: 'fi-5', date: '2026-11-24', description: 'Room Service — Poisson Braisé', category: 'room_service', quantity: 1, unitPrice: 12000, payer: 'guest' },
        ],
        payments: [
          { id: 'pay-1', date: '2026-11-24', method: 'card', amount: 45000, payer: 'guest', reference: 'OTA-PREPAID' },
        ],
      },
      {
        id: 'fol-3',
        reservationId: 'res-3',
        guestId: 'g-3',
        isClosed: false,
        items: [
          { id: 'fi-6', date: '2026-11-25', description: 'Nuitée Chambre 103 (x3)', category: 'room', quantity: 3, unitPrice: 55250, payer: 'company' },
        ],
        payments: [],
      },
      {
        id: 'fol-4',
        reservationId: 'res-4',
        guestId: 'g-4',
        isClosed: false,
        items: [
          { id: 'fi-7', date: '2026-11-25', description: 'Nuitée Chambre 106 (x2)', category: 'room', quantity: 2, unitPrice: 45000, payer: 'guest' },
        ],
        payments: [
          { id: 'pay-2', date: '2026-11-24', method: 'mobile_money', amount: 25000, payer: 'guest', reference: 'MTN-MOMO-881' },
        ],
      },
      {
        id: 'fol-5',
        reservationId: 'res-5',
        guestId: 'g-1',
        isClosed: false,
        items: [
          { id: 'fi-8', date: '2026-11-24', description: 'Suite 105 (x3)', category: 'room', quantity: 3, unitPrice: 114750, payer: 'company' },
        ],
        payments: [],
      },
    ],
    catalog: [
      { id: 'cat-1', name: 'Cocktail Le Palmier', category: 'bar', unitPrice: 4500, unitCost: 1500, stockQty: 42, minThreshold: 10, soldCount: 18 },
      { id: 'cat-2', name: 'Jus d’Ananas Frais', category: 'bar', unitPrice: 2500, unitCost: 700, stockQty: 28, minThreshold: 10, soldCount: 34 },
      { id: 'cat-3', name: 'Room Service — Poisson Braisé', category: 'room_service', unitPrice: 12000, unitCost: 5000, stockQty: 15, minThreshold: 5, soldCount: 12 },
      { id: 'cat-4', name: 'Room Service — Club Sandwich', category: 'room_service', unitPrice: 7500, unitCost: 2500, stockQty: 20, minThreshold: 5, soldCount: 22 },
      { id: 'cat-5', name: 'Minibar — Eau Minérale 50cl', category: 'minibar', unitPrice: 1500, unitCost: 350, stockQty: 60, minThreshold: 20, soldCount: 45 },
      { id: 'cat-6', name: 'Draps Percale King (Linge)', category: 'linen', unitPrice: 0, unitCost: 12000, stockQty: 6, minThreshold: 12, soldCount: 0 },
      { id: 'cat-7', name: 'Kit Accueil Karité', category: 'amenities', unitPrice: 0, unitCost: 1200, stockQty: 45, minThreshold: 15, soldCount: 0 },
    ],
    maintenanceTickets: [
      { id: 'mt-1', roomId: 'room-108', roomNumber: '202', title: 'Climatiseur bruyant — fuite condensat', priority: 'high', status: 'open', reportedAt: '2026-11-24' },
    ],
    lostAndFound: [
      { id: 'lf-1', roomNumber: '104', description: 'Chargeur USB-C blanc', foundDate: '2026-11-24', status: 'stored' },
    ],
    nightAudits: [
      {
        id: 'na-1',
        date: '2026-11-24',
        roomRevenue: 243000,
        extrasRevenue: 21000,
        taxesCollected: 43740,
        discrepancy: 0,
        occupancyRate: 66.7,
        adr: 48600,
        revpar: 32400,
        closedBy: 'Système (Démo)',
      },
    ],
    pedagogy: {
      mode: 'learning',
      currentLevel: 1,
      score: 120,
      badges: ['Explorateur OpenPMS'],
      completedScenarios: ['sc-1-3'],
      quizScores: {},
      activeScenarioId: 'sc-1-1',
    },
    collaborators: [
      { email: 'reception@lepalmier.bj', name: 'Nadège T. (Réception)', role: 'reception', addedAt: '2026-11-20T09:00:00Z' },
      { email: 'gouvernante@lepalmier.bj', name: 'Amina K. (Gouvernante)', role: 'housekeeping', addedAt: '2026-11-20T09:00:00Z' },
    ],
    actionLog: [
      {
        id: 'act-1',
        timestamp: '2026-11-25T07:45:00Z',
        actorName: 'Nadège T. (Réception)',
        actorEmail: 'reception@lepalmier.bj',
        category: 'reservation',
        action: 'Création réservation OPMS-2604',
        details: 'Aïcha Diallo • Chambre 106 • 2 nuits (45 000 FCFA/nuit)',
      },
      {
        id: 'act-2',
        timestamp: '2026-11-25T08:10:00Z',
        actorName: 'Amina K. (Gouvernante)',
        actorEmail: 'gouvernante@lepalmier.bj',
        category: 'housekeeping',
        action: 'Chambre 103 passée en Inspectée',
        details: 'Prête pour l’arrivée de Marc Dubois',
      },
    ],
  };
}

export function createSeedMembers(): MemberAccount[] {
  const cot = createCotonouProject('proj-cotonou-admin');
  const studentProj = createCotonouProject('proj-student-demo');
  studentProj.name = 'TP Étudiant — Hôtel Le Palmier';

  const hotelierProj = createCotonouProject('proj-hotelier-1');
  hotelierProj.name = 'Auberge du Lac — Nokoué';
  hotelierProj.config.hotelName = 'Auberge du Lac';
  hotelierProj.config.totalRooms = 8;
  hotelierProj.rooms = buildRooms(8, 2, 'FCFA');
  hotelierProj.pedagogy.mode = 'live';

  return [
    {
      id: 'mem-admin',
      email: 'admin@openpms.org',
      passwordHash: 'admin123',
      name: 'Jérôme Foguenne (Admin)',
      organization: 'OpenPMS / HECh',
      role: 'admin',
      status: 'active',
      createdAt: '2026-11-01T08:00:00Z',
      lastActiveAt: '2026-11-25T08:10:00Z',
      charterAccepted: true,
      charterAcceptedAt: '2026-11-01T08:00:00Z',
      activeProjectId: cot.id,
      projects: [cot],
    },
    {
      id: 'mem-student',
      email: 'etudiant@hech.be',
      passwordHash: 'etudiant123',
      name: 'Amina Kouassi (Étudiante)',
      organization: 'Formation Hôtelière Bénin-HECh',
      role: 'member',
      status: 'active',
      createdAt: '2026-11-10T10:00:00Z',
      lastActiveAt: '2026-11-25T07:50:00Z',
      charterAccepted: true,
      charterAcceptedAt: '2026-11-10T10:00:00Z',
      activeProjectId: studentProj.id,
      projects: [studentProj],
    },
    {
      id: 'mem-hotelier',
      email: 'contact@aubergedulac.bj',
      passwordHash: 'hotel123',
      name: 'Patrice Soglo (Hôtelier)',
      organization: 'Auberge du Lac — Bénin',
      role: 'member',
      status: 'active',
      createdAt: '2026-11-15T14:00:00Z',
      lastActiveAt: '2026-11-24T19:20:00Z',
      charterAccepted: true,
      charterAcceptedAt: '2026-11-15T14:00:00Z',
      activeProjectId: hotelierProj.id,
      projects: [hotelierProj],
    },
  ];
}

export function createSeedTelemetry(): TelemetryEvent[] {
  return [
    {
      id: 'tel-1',
      memberId: 'mem-student',
      memberName: 'Amina Kouassi (Étudiante)',
      projectId: 'proj-student-demo',
      projectName: 'TP Étudiant — Hôtel Le Palmier',
      timestamp: '2026-11-25T07:45:00Z',
      type: 'reservation_created',
      revenueDelta: 90000,
      roomsDelta: 1,
      itemsDelta: 0,
      currency: 'FCFA',
      detail: 'Réservation OPMS-2604 (2 nuits Standard)',
    },
    {
      id: 'tel-2',
      memberId: 'mem-hotelier',
      memberName: 'Patrice Soglo (Hôtelier)',
      projectId: 'proj-hotelier-1',
      projectName: 'Auberge du Lac — Nokoué',
      timestamp: '2026-11-24T18:30:00Z',
      type: 'item_sold',
      revenueDelta: 16500,
      roomsDelta: 0,
      itemsDelta: 3,
      currency: 'FCFA',
      detail: 'Vente Bar & Room Service (2 cocktails + 1 plat)',
    },
    {
      id: 'tel-3',
      memberId: 'mem-hotelier',
      memberName: 'Patrice Soglo (Hôtelier)',
      projectId: 'proj-hotelier-1',
      projectName: 'Auberge du Lac — Nokoué',
      timestamp: '2026-11-24T22:00:00Z',
      type: 'night_audit',
      revenueDelta: 264000,
      roomsDelta: 4,
      itemsDelta: 0,
      currency: 'FCFA',
      detail: 'Clôture Night Audit du 2026-11-24',
    },
  ];
}
