import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  LogIn,
  Receipt,
  Sparkles,
  Package,
  BarChart3,
  Sliders,
  GraduationCap,
  FolderKanban,
  ShieldAlert,
  Search,
  Clock,
  LogOut,
  Building2,
  Globe,
  Moon,
} from 'lucide-react';
import type {
  CurrencyCode,
  FolioCategory,
  Guest,
  HotelConfig,
  HotelProject,
  Language,
  MemberAccount,
  PaymentMethod,
  PedagogicalMode,
  Reservation,
  RoomStatus,
  TelemetryEvent,
} from './types/pms';
import { translations } from './i18n/translations';
import {
  appendTelemetry,
  loadCurrentMemberId,
  loadMembers,
  loadTelemetry,
  saveCurrentMemberId,
  saveMembers,
} from './lib/storage';
import { buildRooms, createCotonouProject } from './data/seedData';
import { addDays, diffNights } from './lib/format';
import { PEDAGOGICAL_SCENARIOS } from './data/pedagogyData';
import { AuthCharterModal } from './components/AuthCharterModal';
import { DashboardView } from './components/DashboardView';
import { TimelinePlanningView } from './components/TimelinePlanningView';
import { ReservationDrawer } from './components/ReservationDrawer';
import { FrontDeskBillingView } from './components/FrontDeskBillingView';
import { HousekeepingInventoryView } from './components/HousekeepingInventoryView';
import { ConfiguratorProjectsView } from './components/ConfiguratorProjectsView';
import { PedagogyReportsView } from './components/PedagogyReportsView';
import { AdminSpaceView } from './components/AdminSpaceView';
import { MemberStatsView } from './components/MemberStatsView';

export function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [members, setMembers] = useState<MemberAccount[]>(() => loadMembers());
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>(() => loadTelemetry());
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(() => loadCurrentMemberId());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const t = translations[lang];

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveCurrentMemberId(currentMemberId);
  }, [currentMemberId]);

  const currentMember = members.find((m) => m.id === currentMemberId) || null;
  const activeProject =
    currentMember?.projects.find((p) => p.id === currentMember.activeProjectId) ||
    currentMember?.projects[0] ||
    null;

  const updateActiveProject = (updater: (proj: HotelProject) => HotelProject) => {
    if (!currentMember || !activeProject) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== currentMember.id) return m;
        return {
          ...m,
          lastActiveAt: new Date().toISOString(),
          projects: m.projects.map((p) =>
            p.id === activeProject.id ? { ...updater(p), updatedAt: new Date().toISOString() } : p
          ),
        };
      })
    );
  };

  const trackEvent = (
    type: TelemetryEvent['type'],
    detail: string,
    deltas: { revenue?: number; rooms?: number; items?: number } = {}
  ) => {
    if (!currentMember || !activeProject) return;
    const updated = appendTelemetry({
      memberId: currentMember.id,
      memberName: currentMember.name,
      projectId: activeProject.id,
      projectName: activeProject.name,
      type,
      revenueDelta: deltas.revenue || 0,
      roomsDelta: deltas.rooms || 0,
      itemsDelta: deltas.items || 0,
      currency: activeProject.config.currency,
      detail,
    });
    setTelemetry(updated);
  };

  const handleLogin = (member: MemberAccount) => {
    setCurrentMemberId(member.id);
    setActiveTab('dashboard');
  };

  const handleRegister = (data: {
    name: string;
    email: string;
    password: string;
    organization: string;
    role: 'member' | 'teacher';
  }) => {
    const newProj = createCotonouProject(`proj-${Date.now()}`);
    newProj.name = `${data.organization} — Mon Hôtel`;
    newProj.config.hotelName = data.organization;
    const newMember: MemberAccount = {
      id: `mem-${Date.now()}`,
      email: data.email,
      passwordHash: data.password,
      name: data.name,
      organization: data.organization,
      role: data.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      charterAccepted: true,
      charterAcceptedAt: new Date().toISOString(),
      activeProjectId: newProj.id,
      projects: [newProj],
    };
    setMembers((prev) => [...prev, newMember]);
    setCurrentMemberId(newMember.id);
    const updated = appendTelemetry({
      memberId: newMember.id,
      memberName: newMember.name,
      projectId: newProj.id,
      projectName: newProj.name,
      type: 'project_created',
      revenueDelta: 0,
      roomsDelta: 0,
      itemsDelta: 0,
      currency: newProj.config.currency,
      detail: `Inscription membre + acceptation Charte OpenPMS`,
    });
    setTelemetry(updated);
  };

  if (!currentMember || !activeProject) {
    return (
      <AuthCharterModal
        lang={lang}
        members={members}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  // Handlers for PMS Operations
  const handleCreateGuest = (guestData: Omit<Guest, 'id' | 'loyaltyPoints'>): Guest => {
    const newGuest: Guest = {
      ...guestData,
      id: `g-${Date.now()}`,
      loyaltyPoints: 0,
    };
    updateActiveProject((p) => ({ ...p, guests: [newGuest, ...p.guests] }));
    return newGuest;
  };

  const handleCreateReservation = (resData: Omit<Reservation, 'id' | 'reference'>) => {
    const resId = `res-${Date.now()}`;
    const ref = `OPMS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes: Reservation = { ...resData, id: resId, reference: ref };
    const nights = diffNights(resData.checkIn, resData.checkOut);
    const roomCharge = resData.nightlyRate * nights;
    const taxCharge = activeProject.config.billing.cityTaxPerNight * nights;

    const newFolio = {
      id: `fol-${Date.now()}`,
      reservationId: resId,
      guestId: resData.guestId,
      isClosed: false,
      items: [
        {
          id: `fi-${Date.now()}-1`,
          date: resData.checkIn,
          description: `Hébergement ${resData.roomType} (${nights} nuits)`,
          category: 'room' as FolioCategory,
          quantity: nights,
          unitPrice: resData.nightlyRate,
          payer: (resData.channel === 'Entreprise' ? 'company' : 'guest') as 'guest' | 'company',
        },
        ...(taxCharge > 0
          ? [
              {
                id: `fi-${Date.now()}-2`,
                date: resData.checkIn,
                description: `Taxe de séjour (${nights} nuits)`,
                category: 'tax' as FolioCategory,
                quantity: nights,
                unitPrice: activeProject.config.billing.cityTaxPerNight,
                payer: (resData.channel === 'Entreprise' ? 'company' : 'guest') as 'guest' | 'company',
              },
            ]
          : []),
      ],
      payments: [],
    };

    updateActiveProject((p) => ({
      ...p,
      reservations: [newRes, ...p.reservations],
      folios: [newFolio, ...p.folios],
    }));
    trackEvent('reservation_created', `Nouvelle réservation ${ref} (${nights} nuits)`, {
      revenue: roomCharge,
      rooms: 1,
    });
  };

  const handleUpdateReservation = (resId: string, patch: Partial<Reservation>) => {
    updateActiveProject((p) => ({
      ...p,
      reservations: p.reservations.map((r) => (r.id === resId ? { ...r, ...patch } : r)),
    }));
  };

  const handleCheckIn = (resId: string, roomId: string) => {
    updateActiveProject((p) => ({
      ...p,
      reservations: p.reservations.map((r) =>
        r.id === resId ? { ...r, status: 'checked_in', roomId } : r
      ),
      rooms: p.rooms.map((rm) => (rm.id === roomId ? { ...rm, status: 'occupied' } : rm)),
    }));
    trackEvent('check_in', `Check-in effectué (${resId})`);
  };

  const handleCheckOut = (resId: string) => {
    const res = activeProject.reservations.find((r) => r.id === resId);
    updateActiveProject((p) => ({
      ...p,
      reservations: p.reservations.map((r) =>
        r.id === resId ? { ...r, status: 'checked_out' } : r
      ),
      rooms: p.rooms.map((rm) => (rm.id === res?.roomId ? { ...rm, status: 'dirty' } : rm)),
      folios: p.folios.map((f) => (f.reservationId === resId ? { ...f, isClosed: true } : f)),
    }));
    trackEvent('check_out', `Check-out effectué (${res?.reference || resId})`);
  };

  const handleAddFolioItem = (
    resId: string,
    item: { description: string; category: FolioCategory; quantity: number; unitPrice: number; payer: 'guest' | 'company' }
  ) => {
    updateActiveProject((p) => ({
      ...p,
      folios: p.folios.map((f) =>
        f.reservationId === resId
          ? {
              ...f,
              items: [
                ...f.items,
                {
                  id: `fi-${Date.now()}`,
                  date: p.simulatedDate,
                  ...item,
                },
              ],
            }
          : f
      ),
    }));
    if (item.unitPrice > 0) {
      trackEvent('item_sold', `${item.description} ajouté au folio`, {
        revenue: item.quantity * item.unitPrice,
        items: item.quantity,
      });
    }
  };

  const handleToggleItemPayer = (resId: string, itemId: string) => {
    updateActiveProject((p) => ({
      ...p,
      folios: p.folios.map((f) =>
        f.reservationId === resId
          ? {
              ...f,
              items: f.items.map((i) =>
                i.id === itemId ? { ...i, payer: i.payer === 'guest' ? 'company' : 'guest' } : i
              ),
            }
          : f
      ),
    }));
  };

  const handleAddPayment = (
    resId: string,
    payment: { method: PaymentMethod; amount: number; payer: 'guest' | 'company' }
  ) => {
    updateActiveProject((p) => ({
      ...p,
      folios: p.folios.map((f) =>
        f.reservationId === resId
          ? {
              ...f,
              payments: [
                ...f.payments,
                { id: `pay-${Date.now()}`, date: p.simulatedDate, ...payment },
              ],
            }
          : f
      ),
    }));
  };

  const handleRunNightAudit = () => {
    const nextDate = addDays(activeProject.simulatedDate, 1);
    const activeRooms = activeProject.rooms.filter((r) => r.status !== 'out_of_order');
    const occ = activeProject.rooms.filter((r) => r.status === 'occupied').length;
    const occRate = activeRooms.length ? Math.round((occ / activeRooms.length) * 100) : 0;
    const roomRev = activeProject.reservations
      .filter((r) => r.status === 'checked_in')
      .reduce((s, r) => s + r.nightlyRate, 0);
    const adr = occ ? Math.round(roomRev / occ) : 0;
    const revpar = activeRooms.length ? Math.round(roomRev / activeRooms.length) : 0;

    updateActiveProject((p) => ({
      ...p,
      simulatedDate: nextDate,
      nightAudits: [
        {
          id: `na-${Date.now()}`,
          date: p.simulatedDate,
          roomRevenue: roomRev,
          extrasRevenue: 0,
          taxesCollected: Math.round(roomRev * (p.config.billing.vatRate / 100)),
          discrepancy: 0,
          occupancyRate: occRate,
          adr,
          revpar,
          closedBy: currentMember.name,
        },
        ...p.nightAudits,
      ],
    }));
    trackEvent('night_audit', `Night Audit clôturé pour ${activeProject.simulatedDate}`, {
      revenue: roomRev,
    });
  };

  const handleUpdateRoomStatus = (roomId: string, status: RoomStatus) => {
    updateActiveProject((p) => ({
      ...p,
      rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, status } : r)),
    }));
  };

  const handleAddMaintenanceTicket = (roomId: string, title: string, priority: 'low' | 'medium' | 'high') => {
    const rm = activeProject.rooms.find((r) => r.id === roomId);
    updateActiveProject((p) => ({
      ...p,
      rooms: priority === 'high' ? p.rooms.map((r) => (r.id === roomId ? { ...r, status: 'out_of_order' } : r)) : p.rooms,
      maintenanceTickets: [
        {
          id: `mt-${Date.now()}`,
          roomId,
          roomNumber: rm?.number || '?',
          title,
          priority,
          status: 'open',
          reportedAt: p.simulatedDate,
        },
        ...p.maintenanceTickets,
      ],
    }));
  };

  const handleResolveTicket = (ticketId: string) => {
    const tkt = activeProject.maintenanceTickets.find((x) => x.id === ticketId);
    updateActiveProject((p) => ({
      ...p,
      maintenanceTickets: p.maintenanceTickets.map((x) => (x.id === ticketId ? { ...x, status: 'resolved' } : x)),
      rooms: tkt ? p.rooms.map((r) => (r.id === tkt.roomId && r.status === 'out_of_order' ? { ...r, status: 'dirty' } : r)) : p.rooms,
    }));
  };

  const handleSellCatalogItem = (itemId: string, resId: string, qty: number) => {
    const item = activeProject.catalog.find((c) => c.id === itemId);
    if (!item) return;
    handleAddFolioItem(resId, {
      description: `${item.name} (POS)`,
      category: item.category === 'bar' ? 'bar' : item.category === 'room_service' ? 'room_service' : 'minibar',
      quantity: qty,
      unitPrice: item.unitPrice,
      payer: 'guest',
    });
    updateActiveProject((p) => ({
      ...p,
      catalog: p.catalog.map((c) =>
        c.id === itemId ? { ...c, stockQty: Math.max(0, c.stockQty - qty), soldCount: c.soldCount + qty } : c
      ),
    }));
  };

  const handleRestockItem = (itemId: string, qty: number) => {
    updateActiveProject((p) => ({
      ...p,
      catalog: p.catalog.map((c) => (c.id === itemId ? { ...c, stockQty: c.stockQty + qty } : c)),
    }));
  };

  const handleUpdateConfig = (newConfig: HotelConfig) => {
    updateActiveProject((p) => {
      const roomsChanged = newConfig.totalRooms !== p.rooms.length || newConfig.floors !== p.config.floors;
      return {
        ...p,
        name: newConfig.hotelName,
        config: newConfig,
        rooms: roomsChanged ? buildRooms(newConfig.totalRooms, newConfig.floors, newConfig.currency) : p.rooms,
      };
    });
    trackEvent('module_toggled', `Paramétrage mis à jour (${newConfig.totalRooms} ch., ${newConfig.currency})`);
  };

  const handleSwitchProject = (projectId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === currentMember.id ? { ...m, activeProjectId: projectId } : m))
    );
  };

  const handleCreateProject = (name: string, rooms: number, currency: CurrencyCode) => {
    const np = createCotonouProject(`proj-${Date.now()}`);
    np.name = name;
    np.config.hotelName = name;
    np.config.totalRooms = rooms;
    np.config.currency = currency;
    np.rooms = buildRooms(rooms, Math.max(1, Math.ceil(rooms / 6)), currency);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentMember.id ? { ...m, projects: [np, ...m.projects], activeProjectId: np.id } : m
      )
    );
    trackEvent('project_created', `Nouveau projet créé : ${name} (${rooms} ch.)`);
  };

  const handleDuplicateProject = (projectId: string) => {
    const src = currentMember.projects.find((p) => p.id === projectId);
    if (!src) return;
    const copy: HotelProject = {
      ...JSON.parse(JSON.stringify(src)),
      id: `proj-${Date.now()}`,
      name: `${src.name} (Copie)`,
      createdAt: new Date().toISOString(),
    };
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentMember.id ? { ...m, projects: [copy, ...m.projects], activeProjectId: copy.id } : m
      )
    );
  };

  const handleImportProject = (proj: HotelProject) => {
    const imported: HotelProject = { ...proj, id: `proj-${Date.now()}` };
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentMember.id ? { ...m, projects: [imported, ...m.projects], activeProjectId: imported.id } : m
      )
    );
  };

  const handleResetCurrentProject = () => {
    const fresh = createCotonouProject(activeProject.id);
    fresh.name = activeProject.name;
    updateActiveProject(() => fresh);
  };

  const activeScenario = PEDAGOGICAL_SCENARIOS.find((s) => s.id === activeProject.pedagogy.activeScenarioId);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'planning', label: t.planning, icon: CalendarRange },
    { id: 'frontDesk', label: t.frontDesk, icon: LogIn },
    { id: 'billing', label: t.billing, icon: Receipt },
    ...(activeProject.config.modules.housekeepingMode !== 'disabled'
      ? [{ id: 'housekeeping', label: t.housekeeping, icon: Sparkles }]
      : []),
    ...(activeProject.config.modules.inventory || activeProject.config.modules.barAndFood || activeProject.config.modules.roomService
      ? [{ id: 'inventory', label: t.inventory, icon: Package }]
      : []),
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'memberStats', label: t.memberStats, icon: BarChart3 },
    { id: 'configurator', label: t.configurator, icon: Sliders },
    { id: 'projects', label: t.projects, icon: FolderKanban },
    { id: 'pedagogy', label: t.pedagogy, icon: GraduationCap },
    ...(currentMember.role === 'admin' ? [{ id: 'admin', label: t.adminSpace, icon: ShieldAlert }] : []),
  ];

  // Quick search results (Mews Commander style)
  const searchMatches = searchQuery.trim()
    ? activeProject.reservations.filter((r) => {
        const g = activeProject.guests.find((x) => x.id === r.guestId);
        const q = searchQuery.toLowerCase();
        return (
          r.reference.toLowerCase().includes(q) ||
          g?.firstName.toLowerCase().includes(q) ||
          g?.lastName.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Deep Navy Mews-Style Sidebar */}
      <aside className="no-print w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-base leading-none">OpenPMS</div>
            <div className="text-[11px] text-slate-400 truncate mt-1">{activeProject.config.hotelName}</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs space-y-2">
          <div className="text-slate-400 truncate">
            <strong className="text-white block truncate">{currentMember.name}</strong>
            {currentMember.organization}
          </div>
          <button
            onClick={() => setCurrentMemberId(null)}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mews Command & Pedagogical Bar */}
        <header className="no-print bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher client, réf. OPMS...' : 'Search guest, ref...'}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-500 text-xs focus:outline-none"
            />
            {searchMatches.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-40 divide-y text-xs">
                {searchMatches.slice(0, 5).map((r) => {
                  const g = activeProject.guests.find((x) => x.id === r.guestId);
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedResId(r.id);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex justify-between"
                    >
                      <span className="font-semibold">{g?.firstName} {g?.lastName}</span>
                      <span className="text-slate-400">{r.reference}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clock, Mode & Lang */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
              {activeProject.pedagogy.mode === 'learning'
                ? t.modeLearning
                : activeProject.pedagogy.mode === 'exercise'
                ? t.modeExercise
                : activeProject.pedagogy.mode === 'exam'
                ? t.modeExam
                : t.modeLive}{' '}
              • {activeProject.pedagogy.score} pts
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {activeProject.simulatedDate}
            </div>

            <button
              onClick={handleRunNightAudit}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1"
              title="Clôturer la journée et avancer l'horloge"
            >
              <Moon className="w-3 h-3 text-amber-400" /> +1J
            </button>

            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 font-bold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" /> {lang.toUpperCase()}
            </button>
          </div>
        </header>

        {/* Pedagogical Assistant Bar (hidden in Exam / Live mode) */}
        {activeScenario && activeProject.pedagogy.mode === 'learning' && activeTab !== 'pedagogy' && (
          <div className="no-print bg-indigo-50 border-b border-indigo-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-indigo-900">Exercice actif (Niv. {activeScenario.level}) :</span>{' '}
              <span className="text-indigo-800">{lang === 'fr' ? activeScenario.titleFr : activeScenario.titleEn}</span> —{' '}
              <span className="text-slate-600">{lang === 'fr' ? activeScenario.objectiveFr : activeScenario.objectiveEn}</span>
            </div>
            <button
              onClick={() => setActiveTab('pedagogy')}
              className="font-bold text-indigo-700 hover:underline shrink-0"
            >
              Voir les étapes →
            </button>
          </div>
        )}

        {/* Workspace */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              project={activeProject}
              lang={lang}
              onNavigate={setActiveTab}
              onSelectReservation={setSelectedResId}
            />
          )}
          {activeTab === 'planning' && (
            <TimelinePlanningView
              project={activeProject}
              lang={lang}
              onSelectReservation={setSelectedResId}
              onCreateGuest={handleCreateGuest}
              onCreateReservation={handleCreateReservation}
            />
          )}
          {(activeTab === 'frontDesk' || activeTab === 'billing') && (
            <FrontDeskBillingView
              mode={activeTab}
              project={activeProject}
              lang={lang}
              onSelectReservation={setSelectedResId}
              onRunNightAudit={handleRunNightAudit}
            />
          )}
          {(activeTab === 'housekeeping' || activeTab === 'inventory') && (
            <HousekeepingInventoryView
              mode={activeTab}
              project={activeProject}
              lang={lang}
              onUpdateRoomStatus={handleUpdateRoomStatus}
              onAddMaintenanceTicket={handleAddMaintenanceTicket}
              onResolveTicket={handleResolveTicket}
              onSellCatalogItemToRoom={handleSellCatalogItem}
              onRestockItem={handleRestockItem}
            />
          )}
          {(activeTab === 'configurator' || activeTab === 'projects') && (
            <ConfiguratorProjectsView
              mode={activeTab}
              project={activeProject}
              projects={currentMember.projects}
              lang={lang}
              onUpdateConfig={handleUpdateConfig}
              onSwitchProject={handleSwitchProject}
              onCreateProject={handleCreateProject}
              onDuplicateProject={handleDuplicateProject}
              onImportProject={handleImportProject}
              onResetCurrentProject={handleResetCurrentProject}
            />
          )}
          {(activeTab === 'pedagogy' || activeTab === 'reports') && (
            <PedagogyReportsView
              mode={activeTab}
              project={activeProject}
              lang={lang}
              onStartScenario={(scId, targetTab) => {
                updateActiveProject((p) => ({
                  ...p,
                  pedagogy: { ...p.pedagogy, activeScenarioId: scId },
                }));
                setActiveTab(targetTab);
              }}
              onCompleteScenario={(scId, points) => {
                updateActiveProject((p) => ({
                  ...p,
                  pedagogy: {
                    ...p.pedagogy,
                    score: p.pedagogy.score + points,
                    completedScenarios: Array.from(new Set([...p.pedagogy.completedScenarios, scId])),
                  },
                }));
              }}
              onSubmitQuiz={(lvl, score) => {
                updateActiveProject((p) => ({
                  ...p,
                  pedagogy: {
                    ...p.pedagogy,
                    score: p.pedagogy.score + 50,
                    quizScores: { ...p.pedagogy.quizScores, [lvl]: score },
                  },
                }));
              }}
              onChangeMode={(m: PedagogicalMode) => {
                updateActiveProject((p) => ({
                  ...p,
                  pedagogy: { ...p.pedagogy, mode: m },
                }));
              }}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'memberStats' && (
            <MemberStatsView
              activeProject={activeProject}
              allProjects={currentMember.projects}
              lang={lang}
            />
          )}
          {activeTab === 'admin' && currentMember.role === 'admin' && (
            <AdminSpaceView
              lang={lang}
              members={members}
              telemetry={telemetry}
              onToggleMemberStatus={(memberId) =>
                setMembers((prev) =>
                  prev.map((m) =>
                    m.id === memberId
                      ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' }
                      : m
                  )
                )
              }
            />
          )}
        </main>
      </div>

      {/* Mews Smart Detail Slide-Out Drawer */}
      {selectedResId && (
        <ReservationDrawer
          project={activeProject}
          reservationId={selectedResId}
          lang={lang}
          onClose={() => setSelectedResId(null)}
          onUpdateReservation={handleUpdateReservation}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onAddFolioItem={handleAddFolioItem}
          onToggleItemPayer={handleToggleItemPayer}
          onAddPayment={handleAddPayment}
        />
      )}
    </div>
  );
}

export default App;
