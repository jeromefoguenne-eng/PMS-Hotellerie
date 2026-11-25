import React from 'react';
import {
  BedDouble,
  TrendingUp,
  LogIn,
  LogOut,
  AlertTriangle,
  CalendarRange,
  Sliders,
  Sparkles,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import type { HotelProject, Language } from '../types/pms';
import { formatMoney } from '../lib/format';

interface DashboardViewProps {
  project: HotelProject;
  lang: Language;
  onNavigate: (tab: string) => void;
  onSelectReservation: (resId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  lang,
  onNavigate,
  onSelectReservation,
}) => {
  const { rooms, reservations, folios, catalog, maintenanceTickets, simulatedDate, config } = project;

  const operationalRooms = rooms.filter((r) => r.status !== 'out_of_order');
  const occupiedCount = rooms.filter((r) => r.status === 'occupied').length;
  const occupancyRate = operationalRooms.length > 0 ? Math.round((occupiedCount / operationalRooms.length) * 100) : 0;

  const activeStays = reservations.filter((r) => r.status === 'checked_in');
  const todayRoomRev = activeStays.reduce((sum, r) => sum + r.nightlyRate, 0);
  const adr = occupiedCount > 0 ? todayRoomRev / occupiedCount : 0;
  const revpar = operationalRooms.length > 0 ? todayRoomRev / operationalRooms.length : 0;

  const arrivalsToday = reservations.filter((r) => r.checkIn === simulatedDate && r.status === 'confirmed');
  const departuresToday = reservations.filter((r) => r.checkOut === simulatedDate && r.status === 'checked_in');
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty' || r.status === 'cleaning');
  const lowStock = catalog.filter((c) => c.stockQty <= c.minThreshold);
  const openTickets = maintenanceTickets.filter((t) => t.status !== 'resolved');

  const getGuestName = (guestId: string) => {
    const g = project.guests.find((x) => x.id === guestId);
    return g ? `${g.firstName} ${g.lastName}` : 'Client';
  };

  const getFolioBalance = (resId: string) => {
    const fol = folios.find((f) => f.reservationId === resId);
    if (!fol) return 0;
    const total = fol.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const paid = fol.payments.reduce((s, p) => s + p.amount, 0);
    return total - paid;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner Mews-style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{config.hotelName}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {config.city}, {config.country}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {lang === 'fr'
              ? `Centre de commande Mews-style • ${config.totalRooms} chambres configurées • Devise : ${config.currency}`
              : `Mews-style Command Center • ${config.totalRooms} rooms • Currency: ${config.currency}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('planning')}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <CalendarRange className="w-4 h-4" />
            {lang === 'fr' ? 'Ouvrir la Timeline' : 'Open Timeline'}
          </button>
          <button
            onClick={() => onNavigate('configurator')}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Sliders className="w-4 h-4" />
            {lang === 'fr' ? 'Modules & Options' : 'Modules & Setup'}
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>{lang === 'fr' ? "Taux d'occupation" : 'Occupancy Rate'}</span>
            <BedDouble className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">{occupancyRate}%</span>
            <span className="text-xs text-slate-500">
              ({occupiedCount}/{operationalRooms.length})
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>ADR (Prix Moyen)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {formatMoney(adr, config.currency)}
          </div>
          <p className="mt-2 text-xs text-emerald-600 font-medium">
            RevPAR : {formatMoney(revpar, config.currency)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>{lang === 'fr' ? 'Arrivées du jour' : "Today's Arrivals"}</span>
            <LogIn className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{arrivalsToday.length}</div>
          <button
            onClick={() => onNavigate('frontDesk')}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            {lang === 'fr' ? 'Traiter les check-ins →' : 'Process check-ins →'}
          </button>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <span>{lang === 'fr' ? 'Départs du jour' : "Today's Departures"}</span>
            <LogOut className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{departuresToday.length}</div>
          <button
            onClick={() => onNavigate('frontDesk')}
            className="mt-2 text-xs font-semibold text-amber-600 hover:underline"
          >
            {lang === 'fr' ? 'Vérifier les check-outs →' : 'Check departures →'}
          </button>
        </div>
      </div>

      {/* Mews Task Feed & Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arrivals & Departures Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'fr' ? 'Flux Réception du jour' : "Today's Front Desk Queue"}
            </h3>
            <span className="text-xs text-slate-500">{simulatedDate}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {arrivalsToday.length === 0 && departuresToday.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {lang === 'fr' ? 'Aucune arrivée ou départ prévu pour cette date.' : 'No arrivals or departures scheduled today.'}
              </div>
            ) : (
              <>
                {arrivalsToday.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onSelectReservation(res.id)}
                    className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                        ARRIVÉE
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{getGuestName(res.guestId)}</div>
                        <div className="text-xs text-slate-500">
                          {res.reference} • {res.roomType} • {res.channel}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">
                      {lang === 'fr' ? 'Ouvrir fiche →' : 'Open drawer →'}
                    </span>
                  </div>
                ))}
                {departuresToday.map((res) => {
                  const bal = getFolioBalance(res.id);
                  return (
                    <div
                      key={res.id}
                      onClick={() => onSelectReservation(res.id)}
                      className="px-5 py-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-bold">
                          DÉPART
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{getGuestName(res.guestId)}</div>
                          <div className="text-xs text-slate-500">
                            {res.reference} • Solde : {formatMoney(bal, config.currency)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-amber-600">
                        {lang === 'fr' ? 'Encaisser & Check-out →' : 'Settle & Check-out →'}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Alerts & Active Modules */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {lang === 'fr' ? 'Alertes Exploitation' : 'Operational Alerts'}
            </h3>
            <div className="space-y-2 text-xs">
              <div
                onClick={() => onNavigate('housekeeping')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between"
              >
                <span className="text-slate-700">{lang === 'fr' ? 'Chambres à nettoyer' : 'Rooms to clean'}</span>
                <span className="font-bold text-amber-600">{dirtyRooms.length}</span>
              </div>
              {config.modules.inventory && (
                <div
                  onClick={() => onNavigate('inventory')}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between"
                >
                  <span className="text-slate-700">{lang === 'fr' ? 'Articles sous seuil stock' : 'Low stock alerts'}</span>
                  <span className={`font-bold ${lowStock.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {lowStock.length}
                  </span>
                </div>
              )}
              <div
                onClick={() => onNavigate('housekeeping')}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between"
              >
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  {lang === 'fr' ? 'Tickets maintenance' : 'Maintenance tickets'}
                </span>
                <span className="font-bold text-red-600">{openTickets.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              {lang === 'fr' ? 'Modules Actifs sur ce Projet' : 'Active Property Modules'}
            </h3>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {config.modules.roomService && (
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Room Service
                </span>
              )}
              {config.modules.barAndFood && (
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Bar & Restauration
                </span>
              )}
              {config.modules.minibar && (
                <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Minibar
                </span>
              )}
              <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium">
                Ménage : {config.modules.housekeepingMode === 'optional_guest_choice' ? 'Au choix client' : config.modules.housekeepingMode === 'included' ? 'Inclus' : 'Désactivé'}
              </span>
              {config.billing.allowSplitBilling && (
                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Facturation scindée
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
