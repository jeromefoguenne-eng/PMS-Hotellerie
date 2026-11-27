import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  LogIn,
  Receipt,
  Sparkles,
  Package,
  BarChart3,
  BarChart2,
  Sliders,
  GraduationCap,
  FolderKanban,
  ShieldAlert,
  Search,
  Clock,
  LogOut,
  Globe,
  Moon,
  History,
  Menu,
  X,
  Plus,
  CheckCircle2,
  Cloud,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  HelpCircle,
} from 'lucide-react';
import type {
  CatalogItem,
  FolioCategory,
  Guest,
  HotelConfig,
  HotelProject,
  Language,
  MemberAccount,
  PaymentMethod,
  PedagogicalMode,
  ProjectActionLog,
  ProjectCollaborator,
  Reservation,
  Room,
  RoomStatus,
  SiteVisitEvent,
  TelemetryEvent,
  UserRole,
} from './types/pms';
import { translations } from './i18n/translations';
import {
  appendTelemetry,
  loadCloudConfig,
  loadCurrentMemberId,
  loadMembers,
  loadSiteVisits,
  loadTelemetry,
  recordSiteVisit,
  saveCurrentMemberId,
  saveMembers,
  saveTelemetry,
} from './lib/storage';
import { pullStateFromSupabase, pushStateToSupabase } from './lib/supabaseSync';
import { buildRooms, createCotonouProject } from './data/seedData';
import { addDays, diffNights } from './lib/format';
import { PEDAGOGICAL_SCENARIOS } from './data/pedagogyData';
import { OpenHotelPmsLogo } from './components/OpenHotelPmsLogo';
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
import { AuditLogTeamView, ROLE_DEFAULT_PERMISSIONS } from './components/AuditLogTeamView';
import { GuestCrmView } from './components/GuestCrmView';
import { GuestPortalModal } from './components/GuestPortalModal';
import { WelcomeOnboardingModal } from './components/WelcomeOnboardingModal';

export function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [members, setMembers] = useState<MemberAccount[]>(() => loadMembers());
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>(() => loadTelemetry());
  const [siteVisits, setSiteVisits] = useState<SiteVisitEvent[]>(() => loadSiteVisits());
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(() => loadCurrentMemberId());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showGuestPortal, setShowGuestPortal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toTimeString().slice(0, 8)
  );
  const [cloudSynced, setCloudSynced] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const t = translations[lang];

  // Auto-pull from Supabase on mount if configured
  useEffect(() => {
    const cfg = loadCloudConfig();
    if (cfg.enabled) {
      pullStateFromSupabase(cfg).then((remote) => {
        if (remote) {
          setMembers(remote.members);
          setTelemetry(remote.telemetry);
          saveMembers(remote.members);
          saveTelemetry(remote.telemetry);
          setCloudSynced(true);
        }
      });
    }
  }, []);

  // Auto-save at instant T + optional Cloud push
  useEffect(() => {
    saveMembers(members);
    setLastSavedTime(new Date().toTimeString().slice(0, 8));
    const cfg = loadCloudConfig();
    if (cfg.enabled) {
      pushStateToSupabase(cfg, members, telemetry).then((ok) => setCloudSynced(ok));
    }
  }, [members, telemetry]);

  useEffect(() => {
    saveCurrentMemberId(currentMemberId);
  }, [currentMemberId]);

  // Projects owned by currentMember + projects shared with currentMember's email as collaborator
  const currentMember = members.find((m) => m.id === currentMemberId) || null;
  const sharedProjectsFromOthers = currentMember
    ? members
        .filter((m) => m.id !== currentMember.id)
        .flatMap((m) =>
          m.projects.filter((p) =>
            p.collaborators?.some((c) => c.email.toLowerCase() === currentMember.email.toLowerCase())
          )
        )
    : [];
  const accessibleProjects = currentMember
    ? [...currentMember.projects, ...sharedProjectsFromOthers]
    : [];

  const activeProject =
    accessibleProjects.find((p) => p.id === currentMember?.activeProjectId) ||
    accessibleProjects[0] ||
    null;

  const isProjectOwner = Boolean(
    currentMember && activeProject && currentMember.projects.some((p) => p.id === activeProject.id)
  );

  const collaboratorEntry =
    !isProjectOwner && currentMember && activeProject
      ? activeProject.collaborators?.find(
          (c) => c.email.toLowerCase() === currentMember.email.toLowerCase()
        )
      : undefined;

  const allowedFeatures: string[] | null = collaboratorEntry
    ? collaboratorEntry.permissions || ROLE_DEFAULT_PERMISSIONS[collaboratorEntry.role]
    : null;

  const logAction = (
    proj: HotelProject,
    category: ProjectActionLog['category'],
    action: string,
    details: string
  ): ProjectActionLog[] => {
    if (!currentMember) return proj.actionLog || [];
    const entry: ProjectActionLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      actorName: currentMember.name,
      actorEmail: currentMember.email,
      category,
      action,
      details,
    };
    return [entry, ...(proj.actionLog || [])].slice(0, 300);
  };

  const updateActiveProject = (updater: (proj: HotelProject) => HotelProject) => {
    if (!currentMember || !activeProject) return;
    setMembers((prev) =>
      prev.map((m) => {
        const ownsProj = m.projects.some((p) => p.id === activeProject.id);
        if (!ownsProj) return m;
        return {
          ...m,
          lastActiveAt: m.id === currentMember.id ? new Date().toISOString() : m.lastActiveAt,
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
    if (!member.hasSeenOnboarding) {
      setShowOnboarding(true);
    }
    setSiteVisits(recordSiteVisit({ memberId: member.id, memberName: member.name, language: lang, tab: 'dashboard' }));
  };

  const handleRegister = (data: {
    name: string;
    email: string;
    passwordHash: string;
    organization: string;
    role: 'member' | 'teacher';
  }) => {
    const newProj = createCotonouProject(`proj-${Date.now()}`);
    newProj.name = `${data.organization} — Mon Hôtel`;
    newProj.config.hotelName = data.organization;
    const newMember: MemberAccount = {
      id: `mem-${Date.now()}`,
      email: data.email,
      passwordHash: data.passwordHash,
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
    setShowOnboarding(true);
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
      detail: `Inscription membre + acceptation Charte Open Hotel PMS`,
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

  // PMS Operations with automatic Audit Log
  const handleCreateGuest = (guestData: Omit<Guest, 'id' | 'loyaltyPoints'>): Guest => {
    const newGuest: Guest = { ...guestData, id: `g-${Date.now()}`, loyaltyPoints: 0 };
    updateActiveProject((p) => ({
      ...p,
      guests: [newGuest, ...p.guests],
      actionLog: logAction(p, 'reservation', 'Création fiche client', `${newGuest.firstName} ${newGuest.lastName}`),
    }));
    return newGuest;
  };

  const handleCreateReservation = (resData: Omit<Reservation, 'id' | 'reference'>) => {
    const resId = `res-${Date.now()}`;
    const ref = `OPMS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes: Reservation = { ...resData, id: resId, reference: ref };
    const nights = diffNights(resData.checkIn, resData.checkOut);
    const roomCharge = resData.nightlyRate * nights;
    const taxCharge = activeProject.config.billing.cityTaxPerNight * nights;
    const guest = activeProject.guests.find((g) => g.id === resData.guestId);

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
      actionLog: logAction(
        p,
        'reservation',
        `Création réservation ${ref}`,
        `${guest?.firstName || ''} ${guest?.lastName || ''} • ${resData.roomType} • ${resData.checkIn} → ${resData.checkOut}`
      ),
    }));
    trackEvent('reservation_created', `Nouvelle réservation ${ref} (${nights} nuits)`, {
      revenue: roomCharge,
      rooms: 1,
    });
  };

  const handleUpdateReservation = (resId: string, patch: Partial<Reservation>) => {
    const res = activeProject.reservations.find((r) => r.id === resId);
    updateActiveProject((p) => ({
      ...p,
      reservations: p.reservations.map((r) => (r.id === resId ? { ...r, ...patch } : r)),
      actionLog: logAction(
        p,
        'reservation',
        `Modification réservation ${res?.reference || resId}`,
        JSON.stringify(patch)
      ),
    }));
  };

  const handleCheckIn = (resId: string, roomId: string) => {
    const res = activeProject.reservations.find((r) => r.id === resId);
    const rm = activeProject.rooms.find((r) => r.id === roomId);
    updateActiveProject((p) => ({
      ...p,
      reservations: p.reservations.map((r) =>
        r.id === resId ? { ...r, status: 'checked_in', roomId } : r
      ),
      rooms: p.rooms.map((x) => (x.id === roomId ? { ...x, status: 'occupied' } : x)),
      actionLog: logAction(p, 'front_desk', `Check-in ${res?.reference || ''}`, `Chambre ${rm?.number || roomId} occupée`),
    }));
    trackEvent('check_in', `Check-in effectué (${res?.reference || resId})`);
  };

  const handleCheckOut = (resId: string) => {
    const res = activeProject.reservations.find((r) => r.id === resId);
    const rm = activeProject.rooms.find((r) => r.id === res?.roomId);
    updateActiveProject((p) => ({
      ...p,
      reservations: p.reservations.map((r) =>
        r.id === resId ? { ...r, status: 'checked_out' } : r
      ),
      rooms: p.rooms.map((x) => (x.id === res?.roomId ? { ...x, status: 'dirty' } : x)),
      folios: p.folios.map((f) => (f.reservationId === resId ? { ...f, isClosed: true } : f)),
      actionLog: logAction(p, 'front_desk', `Check-out ${res?.reference || ''}`, `Chambre ${rm?.number || ''} passée en À nettoyer`),
    }));
    trackEvent('check_out', `Check-out effectué (${res?.reference || resId})`);
  };

  const handleAddFolioItem = (
    resId: string,
    item: { description: string; category: FolioCategory; quantity: number; unitPrice: number; payer: 'guest' | 'company' }
  ) => {
    const res = activeProject.reservations.find((r) => r.id === resId);
    updateActiveProject((p) => ({
      ...p,
      folios: p.folios.map((f) =>
        f.reservationId === resId
          ? { ...f, items: [...f.items, { id: `fi-${Date.now()}`, date: p.simulatedDate, ...item }] }
          : f
      ),
      actionLog: logAction(
        p,
        'billing',
        `Ajout folio (${res?.reference || ''})`,
        `${item.description} • ${item.quantity} × ${item.unitPrice} (${item.payer})`
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
      actionLog: logAction(p, 'billing', 'Modification payeur (Facture scindée)', `Ligne ${itemId}`),
    }));
  };

  const handleAddPayment = (
    resId: string,
    payment: { method: PaymentMethod; amount: number; payer: 'guest' | 'company' }
  ) => {
    const res = activeProject.reservations.find((r) => r.id === resId);
    updateActiveProject((p) => ({
      ...p,
      folios: p.folios.map((f) =>
        f.reservationId === resId
          ? { ...f, payments: [...f.payments, { id: `pay-${Date.now()}`, date: p.simulatedDate, ...payment }] }
          : f
      ),
      actionLog: logAction(
        p,
        'billing',
        `Encaissement (${res?.reference || ''})`,
        `${payment.amount} via ${payment.method.toUpperCase()} (${payment.payer})`
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
      actionLog: logAction(p, 'billing', `Night Audit clôturé (${p.simulatedDate})`, `Occupation ${occRate}% • Passage au ${nextDate}`),
    }));
    trackEvent('night_audit', `Night Audit clôturé pour ${activeProject.simulatedDate}`, { revenue: roomRev });
  };

  const handleUpdateRoomStatus = (roomId: string, status: RoomStatus) => {
    const rm = activeProject.rooms.find((r) => r.id === roomId);
    updateActiveProject((p) => ({
      ...p,
      rooms: p.rooms.map((r) => (r.id === roomId ? { ...r, status } : r)),
      actionLog: logAction(p, 'housekeeping', `Statut Chambre ${rm?.number || ''}`, `Passée en "${status}"`),
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
      actionLog: logAction(p, 'housekeeping', `Ticket Maintenance Ch. ${rm?.number || ''}`, `${title} (${priority})`),
    }));
  };

  const handleResolveTicket = (ticketId: string) => {
    const tkt = activeProject.maintenanceTickets.find((x) => x.id === ticketId);
    updateActiveProject((p) => ({
      ...p,
      maintenanceTickets: p.maintenanceTickets.map((x) => (x.id === ticketId ? { ...x, status: 'resolved' } : x)),
      rooms: tkt ? p.rooms.map((r) => (r.id === tkt.roomId && r.status === 'out_of_order' ? { ...r, status: 'dirty' } : r)) : p.rooms,
      actionLog: logAction(p, 'housekeeping', `Ticket résolu Ch. ${tkt?.roomNumber || ''}`, tkt?.title || ''),
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
    const item = activeProject.catalog.find((c) => c.id === itemId);
    updateActiveProject((p) => ({
      ...p,
      catalog: p.catalog.map((c) => (c.id === itemId ? { ...c, stockQty: c.stockQty + qty } : c)),
      actionLog: logAction(p, 'inventory', `Réapprovisionnement stock`, `+${qty} × ${item?.name || itemId}`),
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
        actionLog: logAction(p, 'config', 'Mise à jour paramétrage hôtel', `${newConfig.hotelName} (${newConfig.totalRooms} ch., ${newConfig.currency})`),
      };
    });
    trackEvent('module_toggled', `Paramétrage mis à jour (${newConfig.totalRooms} ch., ${newConfig.currency})`);
  };

  const handleSwitchProject = (projectId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === currentMember.id ? { ...m, activeProjectId: projectId } : m))
    );
  };

  const handleCreateConfiguredProject = (config: HotelConfig) => {
    const np = createCotonouProject(`proj-${Date.now()}`);
    np.name = config.hotelName;
    np.config = config;
    np.rooms = buildRooms(config.totalRooms, config.floors, config.currency);
    np.reservations = [];
    np.folios = [];
    np.actionLog = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: currentMember.name,
        actorEmail: currentMember.email,
        category: 'config',
        action: 'Création & paramétrage initial du projet',
        details: `${config.hotelName} • ${config.totalRooms} chambres • ${config.currency}`,
      },
    ];
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentMember.id ? { ...m, projects: [np, ...m.projects], activeProjectId: np.id } : m
      )
    );
    trackEvent('project_created', `Nouvel hôtel configuré : ${config.hotelName} (${config.totalRooms} ch.)`);
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

  const handleDeleteProject = (projectId: string) => {
    if (!currentMember) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== currentMember.id) return m;
        const remaining = m.projects.filter((p) => p.id !== projectId);
        if (remaining.length === 0) return m;
        return {
          ...m,
          projects: remaining,
          activeProjectId: m.activeProjectId === projectId ? remaining[0].id : m.activeProjectId,
        };
      })
    );
  };

  const handleResetCurrentProject = () => {
    const fresh = createCotonouProject(activeProject.id);
    fresh.name = activeProject.name;
    updateActiveProject(() => fresh);
  };

  const handleAddCollaborator = (collab: Omit<ProjectCollaborator, 'addedAt'>) => {
    updateActiveProject((p) => ({
      ...p,
      collaborators: [...(p.collaborators || []), { ...collab, addedAt: new Date().toISOString() }],
      actionLog: logAction(p, 'team', `Ajout collaborateur`, `${collab.name} (${collab.email} - ${collab.role})`),
    }));
  };

  const handleRemoveCollaborator = (email: string) => {
    updateActiveProject((p) => ({
      ...p,
      collaborators: (p.collaborators || []).filter((c) => c.email !== email),
      actionLog: logAction(p, 'team', `Retrait collaborateur`, email),
    }));
  };

  const activeScenario = PEDAGOGICAL_SCENARIOS.find((s) => s.id === activeProject.pedagogy.activeScenarioId);

  const rawNavGroups: { title: string; items: { id: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
    {
      title: 'Opérations',
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'planning', label: 'Timeline (Planning)', icon: CalendarRange },
        { id: 'frontDesk', label: 'Reservations & Front Desk', icon: LogIn },
        { id: 'crm', label: 'CRM Clients & Profils', icon: Users },
        ...(activeProject.config.modules.housekeepingMode !== 'disabled'
          ? [{ id: 'housekeeping', label: 'Housekeeping & Maintenance', icon: Sparkles }]
          : []),
      ],
    },
    {
      title: 'Finance & POS',
      items: [
        { id: 'billing', label: 'Billing & Accounting', icon: Receipt },
        ...(activeProject.config.modules.inventory || activeProject.config.modules.barAndFood || activeProject.config.modules.roomService
          ? [{ id: 'inventory', label: 'POS & Inventory', icon: Package }]
          : []),
      ],
    },
    {
      title: 'Pilotage',
      items: [
        { id: 'memberStats', label: t.memberStats, icon: BarChart2 },
        { id: 'reports', label: t.reports, icon: BarChart3 },
      ],
    },
    {
      title: 'Configuration & Équipe',
      items: [
        { id: 'configurator', label: 'Marketplace / Modules', icon: Sliders },
        { id: 'projects', label: t.projects, icon: FolderKanban },
        { id: 'auditLog', label: 'Historique Actions', icon: History },
      ],
    },
    {
      title: 'Formation',
      items: [
        { id: 'pedagogy', label: t.pedagogy, icon: GraduationCap },
        ...(currentMember.role === 'admin' ? [{ id: 'admin', label: t.adminSpace, icon: ShieldAlert }] : []),
      ],
    },
  ];

  const navGroups = rawNavGroups
    .map((grp) => ({
      ...grp,
      items: allowedFeatures
        ? grp.items.filter((item) => allowedFeatures.includes(item.id))
        : grp.items,
    }))
    .filter((grp) => grp.items.length > 0);

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
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* MEWS-STYLE TOP COMMAND BAR (64px) */}
      <header className="no-print h-16 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-40 shadow-2xs">
        {/* Left: Hamburger + Brand + Property Switcher (Mews signature) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <OpenHotelPmsLogo size="sm" darkText />

          <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

          {/* Property Switcher directly in Top Bar (own + shared projects) */}
          <select
            value={activeProject.id}
            onChange={(e) => handleSwitchProject(e.target.value)}
            className="hidden sm:block max-w-[200px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-xs font-semibold text-slate-800 border border-transparent focus:border-indigo-500 focus:outline-none truncate"
            title="Changer d'hôtel / projet"
          >
            {accessibleProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.config.hotelName} ({p.config.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Center: Mews Global Commander Search (Ctrl+K) */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'fr' ? 'Rechercher client, réf...' : 'Search guest, ref...'}
            className="w-full pl-9 pr-16 py-1.5 rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-500 text-xs focus:outline-none transition"
          />
          <kbd className="absolute right-2.5 top-1.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-400">
            Ctrl+K
          </kbd>
          {searchMatches.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 divide-y text-xs">
              {searchMatches.slice(0, 6).map((r) => {
                const g = activeProject.guests.find((x) => x.id === r.guestId);
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedResId(r.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 flex justify-between"
                  >
                    <span className="font-semibold text-slate-900">
                      {g?.firstName} {g?.lastName}
                    </span>
                    <span className="text-slate-400">{r.reference} • {r.checkIn}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Quick Create, Guest Portal, Auto-Save, Clock, Lang, Profile */}
        <div className="flex items-center gap-2 text-xs">
          {activeProject.config.modules.onlineCheckIn && (
            <button
              onClick={() => setShowGuestPortal(true)}
              className="hidden sm:flex px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold items-center gap-1"
              title="Simuler le portail Client Online Check-in (Mews Guest Portal)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Guest Portal</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('planning')}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 shadow-2xs"
            title="Accès rapide Timeline & Réservation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Réserver</span>
          </button>

          <div
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px]"
            title="Sauvegarde automatique à l'instant T"
          >
            {cloudSynced ? <Cloud className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
            <span>{lastSavedTime}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>{activeProject.simulatedDate}</span>
          </div>

          <button
            onClick={handleRunNightAudit}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1"
            title="Night Audit (+1 Jour)"
          >
            <Moon className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">+1J</span>
          </button>

          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5" /> {lang.toUpperCase()}
          </button>

          <button
            onClick={() => setShowOnboarding(true)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600"
            title="Guide d'utilisation OpenHotelPMS"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentMemberId(null)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-600"
            title={t.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {/* MEWS-STYLE COLLAPSIBLE LEFT NAVIGATION RAIL (Sticky + Larger font text-sm) */}
        <aside
          className={`no-print ${
            mobileMenuOpen ? 'fixed inset-y-16 left-0 z-40 flex shadow-2xl w-68' : 'hidden lg:flex lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]'
          } ${sidebarCollapsed ? 'lg:w-18' : 'lg:w-68'} bg-slate-900 text-slate-200 flex-col shrink-0 border-r border-slate-800 transition-all`}
        >
          <div className="hidden lg:flex justify-end px-3 pt-2.5">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={sidebarCollapsed ? 'Déplier le menu' : 'Replier en icônes'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      title={item.label}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                      } py-2.5 rounded-lg text-sm font-medium transition ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-3.5 border-t border-slate-800 text-xs space-y-1 bg-slate-950/40">
              <div className="font-bold text-white truncate">{currentMember.name}</div>
              <div className="text-slate-400 truncate">{currentMember.organization}</div>
              <div className="text-emerald-400 font-semibold pt-0.5">
                {activeProject.pedagogy.mode === 'live'
                  ? 'Mode Hôtel Réel'
                  : `Mode ${activeProject.pedagogy.mode} • ${activeProject.pedagogy.score} pts`}
              </div>
            </div>
          )}
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeScenario && activeProject.pedagogy.mode === 'learning' && activeTab !== 'pedagogy' && (
            <div className="no-print bg-indigo-50 border-b border-indigo-200 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-indigo-900">Exercice actif (Niv. {activeScenario.level}) :</span>{' '}
                <span className="text-indigo-800">{lang === 'fr' ? activeScenario.titleFr : activeScenario.titleEn}</span>
              </div>
              <button
                onClick={() => setActiveTab('pedagogy')}
                className="font-bold text-indigo-700 hover:underline shrink-0"
              >
                Voir les étapes →
              </button>
            </div>
          )}

          <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 sm:pb-6 max-w-7xl w-full mx-auto">
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
                onMoveReservationRoom={(resId, newRoomId) => {
                  const res = activeProject.reservations.find((r) => r.id === resId);
                  const rm = activeProject.rooms.find((r) => r.id === newRoomId);
                  updateActiveProject((p) => ({
                    ...p,
                    reservations: p.reservations.map((r) =>
                      r.id === resId ? { ...r, roomId: newRoomId } : r
                    ),
                    actionLog: logAction(
                      p,
                      'reservation',
                      `Déplacement Timeline (${res?.reference || resId})`,
                      `Assignée à la chambre ${rm?.number || newRoomId}`
                    ),
                  }));
                }}
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
            {activeTab === 'crm' && (
              <GuestCrmView
                project={activeProject}
                lang={lang}
                actorName={currentMember.name}
                onCreateGuest={handleCreateGuest}
                onUpdateGuest={(guestId, patch) =>
                  updateActiveProject((p) => ({
                    ...p,
                    guests: p.guests.map((g) => (g.id === guestId ? { ...g, ...patch } : g)),
                  }))
                }
                onSelectReservation={setSelectedResId}
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
                onUpdateRooms={(rooms: Room[]) =>
                  updateActiveProject((p) => ({
                    ...p,
                    rooms,
                    config: { ...p.config, totalRooms: rooms.length },
                    actionLog: logAction(p, 'config', 'Mise à jour des chambres & équipements', `${rooms.length} chambres configurées`),
                  }))
                }
                onUpdateCatalog={(catalog: CatalogItem[]) =>
                  updateActiveProject((p) => ({
                    ...p,
                    catalog,
                    actionLog: logAction(p, 'config', 'Mise à jour carte Bar / Room Service', `${catalog.length} articles`),
                  }))
                }
                onSwitchProject={handleSwitchProject}
                onCreateConfiguredProject={handleCreateConfiguredProject}
                onDuplicateProject={handleDuplicateProject}
                onDeleteProject={handleDeleteProject}
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
            {activeTab === 'auditLog' && (
              <AuditLogTeamView
                project={activeProject}
                lang={lang}
                isOwner={isProjectOwner}
                onAddCollaborator={handleAddCollaborator}
                onUpdateCollaboratorPermissions={(email, permissions) =>
                  updateActiveProject((p) => ({
                    ...p,
                    collaborators: (p.collaborators || []).map((c) =>
                      c.email.toLowerCase() === email.toLowerCase() ? { ...c, permissions } : c
                    ),
                    actionLog: logAction(p, 'team', 'Modification accès employé', `${email} (${permissions.length} modules)`),
                  }))
                }
                onRemoveCollaborator={handleRemoveCollaborator}
              />
            )}
            {activeTab === 'admin' && currentMember.role === 'admin' && (
              <AdminSpaceView
                lang={lang}
                currentAdminId={currentMember.id}
                members={members}
                telemetry={telemetry}
                siteVisits={siteVisits}
                onToggleMemberStatus={(memberId) =>
                  setMembers((prev) =>
                    prev.map((m) =>
                      m.id === memberId
                        ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' }
                        : m
                    )
                  )
                }
                onChangeMemberRole={(memberId, role: UserRole) =>
                  setMembers((prev) =>
                    prev.map((m) => (m.id === memberId ? { ...m, role } : m))
                  )
                }
                onDeleteMember={(memberId) =>
                  setMembers((prev) => prev.filter((m) => m.id !== memberId))
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Quick Navigation (Smartphones) */}
      <nav className="no-print sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around py-1.5 text-[10px] font-semibold text-slate-600">
        {[
          { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
          { id: 'planning', label: 'Timeline', icon: CalendarRange },
          { id: 'frontDesk', label: 'Réception', icon: LogIn },
          { id: 'billing', label: 'Caisse', icon: Receipt },
          { id: 'memberStats', label: 'Stats', icon: BarChart2 },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${
                active ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* First-Login Welcome Onboarding Guide */}
      {showOnboarding && (
        <WelcomeOnboardingModal
          memberName={currentMember.name}
          onClose={() => {
            setShowOnboarding(false);
            setMembers((prev) =>
              prev.map((m) =>
                m.id === currentMember.id ? { ...m, hasSeenOnboarding: true } : m
              )
            );
          }}
          onGoToProjects={() => setActiveTab('projects')}
        />
      )}

      {/* Mews Guest Portal / Online Check-in Simulator */}
      {showGuestPortal && (
        <GuestPortalModal
          project={activeProject}
          onClose={() => setShowGuestPortal(false)}
          onCompleteOnlineCheckIn={(resId, hkChoice, idNum) => {
            const res = activeProject.reservations.find((r) => r.id === resId);
            updateActiveProject((p) => ({
              ...p,
              reservations: p.reservations.map((r) =>
                r.id === resId ? { ...r, housekeepingChoice: hkChoice } : r
              ),
              guests: p.guests.map((g) =>
                g.id === res?.guestId && idNum ? { ...g, idNumber: idNum } : g
              ),
              actionLog: logAction(
                p,
                'front_desk',
                `Self Check-in en ligne (${res?.reference || resId})`,
                `Fiche signée • Ménage : ${hkChoice}`
              ),
            }));
          }}
        />
      )}

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
