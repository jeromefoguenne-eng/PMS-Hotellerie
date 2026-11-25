import React, { useState } from 'react';
import {
  Plus,
  UserPlus,
  Calendar,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import type {
  Guest,
  HotelProject,
  Language,
  Reservation,
  RoomType,
  SalesChannel,
} from '../types/pms';
import { addDays, diffNights, formatMoney } from '../lib/format';

interface TimelinePlanningViewProps {
  project: HotelProject;
  lang: Language;
  onSelectReservation: (resId: string) => void;
  onCreateGuest: (guest: Omit<Guest, 'id' | 'loyaltyPoints'>) => Guest;
  onCreateReservation: (res: Omit<Reservation, 'id' | 'reference'>) => void;
  onMoveReservationRoom: (resId: string, newRoomId: string) => void;
}

type Density = 'compact' | 'default' | 'comfortable';
type Horizon = 7 | 14 | 30;

export const TimelinePlanningView: React.FC<TimelinePlanningViewProps> = ({
  project,
  lang,
  onSelectReservation,
  onCreateGuest,
  onCreateReservation,
  onMoveReservationRoom,
}) => {
  const [density, setDensity] = useState<Density>('default');
  const [horizon, setHorizon] = useState<Horizon>(14);
  const [startOffset, setStartOffset] = useState<number>(-1);
  const [collapsedTypes, setCollapsedTypes] = useState<Record<string, boolean>>({});
  const [draggedResId, setDraggedResId] = useState<string | null>(null);
  const [dragOverRoomId, setDragOverRoomId] = useState<string | null>(null);

  const [showNewRes, setShowNewRes] = useState(false);
  const [showNewGuest, setShowNewGuest] = useState(false);

  // New Guest Form
  const [gFirst, setGFirst] = useState('');
  const [gLast, setGLast] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gNat, setGNat] = useState('Béninoise');
  const [gIdNum, setGIdNum] = useState('');
  const [gVip, setGVip] = useState<Guest['vipStatus']>('Standard');
  const [gPref, setGPref] = useState('');

  // New Reservation Form
  const [rGuestId, setRGuestId] = useState(project.guests[0]?.id || '');
  const [rRoomType, setRRoomType] = useState<RoomType>('Standard');
  const [rRoomId, setRRoomId] = useState<string>('');
  const [rCheckIn, setRCheckIn] = useState(project.simulatedDate);
  const [rCheckOut, setRCheckOut] = useState(addDays(project.simulatedDate, 2));
  const [rRatePlanId, setRRatePlanId] = useState(project.config.ratePlans[0]?.id || 'rp-public');
  const [rChannel, setRChannel] = useState<SalesChannel>('Direct');
  const [rStatus, setRStatus] = useState<'confirmed' | 'waitlist'>('confirmed');
  const [rGuarantee, setRGuarantee] = useState<Reservation['guaranteeType']>('card');
  const [rHousekeeping, setRHousekeeping] = useState<Reservation['housekeepingChoice']>(
    project.config.modules.housekeepingMode === 'optional_guest_choice' ? 'requested' : 'included'
  );
  const [rGroup, setRGroup] = useState('');
  const [rNotes, setRNotes] = useState('');

  const days = Array.from({ length: horizon }, (_, idx) =>
    addDays(project.simulatedDate, startOffset + idx)
  );
  const roomTypes = Array.from(new Set(project.rooms.map((r) => r.type)));

  const rowHeight = density === 'compact' ? 'h-9' : density === 'comfortable' ? 'h-14' : 'h-11';

  const statusDot = (s: string) => {
    switch (s) {
      case 'available':
      case 'inspected':
        return 'bg-emerald-500';
      case 'occupied':
        return 'bg-blue-500';
      case 'dirty':
      case 'cleaning':
        return 'bg-amber-500';
      case 'out_of_order':
        return 'bg-red-500';
      default:
        return 'bg-slate-400';
    }
  };

  const resBarColor = (r: Reservation) => {
    if (r.status === 'checked_in') return 'bg-indigo-600 text-white border-indigo-700';
    if (r.status === 'confirmed' && r.checkIn === project.simulatedDate)
      return 'bg-blue-500 text-white border-blue-600';
    if (r.status === 'confirmed') return 'bg-emerald-600 text-white border-emerald-700';
    if (r.status === 'checked_out') return 'bg-slate-400 text-white border-slate-500';
    return 'bg-amber-500 text-white border-amber-600';
  };

  const getGuestName = (id: string) => {
    const g = project.guests.find((x) => x.id === id);
    return g ? `${g.firstName} ${g.lastName}` : 'Client';
  };

  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gFirst.trim() || !gLast.trim()) return;
    const created = onCreateGuest({
      firstName: gFirst.trim(),
      lastName: gLast.trim(),
      email: gEmail.trim(),
      phone: gPhone.trim(),
      nationality: gNat.trim(),
      idNumber: gIdNum.trim(),
      vipStatus: gVip,
      preferences: gPref.trim(),
      notes: '',
    });
    setRGuestId(created.id);
    setShowNewGuest(false);
    setGFirst('');
    setGLast('');
    setGIdNum('');
    setGPref('');
  };

  const handleSaveReservation = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenRoom =
      project.rooms.find((r) => r.id === rRoomId) ||
      project.rooms.find((r) => r.type === rRoomType && r.status !== 'out_of_order');
    const plan = project.config.ratePlans.find((p) => p.id === rRatePlanId);
    const baseRate = chosenRoom?.baseRate || 45000;
    const nightlyRate = Math.round(baseRate * (plan?.multiplier ?? 1));

    onCreateReservation({
      guestId: rGuestId || project.guests[0]?.id,
      roomId: rStatus === 'waitlist' ? undefined : rRoomId ? chosenRoom?.id : chosenRoom?.id,
      roomType: rRoomType,
      checkIn: rCheckIn,
      checkOut: rCheckOut,
      adults: 1,
      children: 0,
      ratePlanId: rRatePlanId,
      channel: rChannel,
      status: rStatus,
      guaranteeType: rGuarantee,
      depositAmount: 0,
      housekeepingChoice: rHousekeeping,
      specialRequests: rNotes,
      groupName: rGroup.trim() || undefined,
      nightlyRate,
    });
    setShowNewRes(false);
    setRGroup('');
    setRNotes('');
  };

  const unassigned = project.reservations.filter(
    (r) => !r.roomId && (r.status === 'confirmed' || r.status === 'checked_in')
  );
  const waitlist = project.reservations.filter((r) => r.status === 'waitlist');

  // Availability count per roomType per day
  const getCategoryAvailable = (type: RoomType, dateStr: string) => {
    const catRooms = project.rooms.filter((r) => r.type === type && r.status !== 'out_of_order');
    const busyCount = project.reservations.filter(
      (r) =>
        r.roomType === type &&
        r.status !== 'cancelled' &&
        r.status !== 'no_show' &&
        r.status !== 'waitlist' &&
        r.checkIn <= dateStr &&
        r.checkOut > dateStr
    ).length;
    return Math.max(0, catRooms.length - busyCount);
  };

  return (
    <div className="space-y-4">
      {/* Mews-Style Timeline Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            {lang === 'fr' ? 'Timeline (Style Mews)' : 'Mews Timeline'}
          </h2>

          {/* Date Navigation */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStartOffset((s) => s - 7)}
              className="p-1.5 rounded-md hover:bg-white text-slate-700"
              title="-7 jours"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setStartOffset(-1)}
              className="px-2.5 py-1 rounded-md hover:bg-white font-semibold text-slate-800"
            >
              {lang === 'fr' ? "Aujourd'hui" : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setStartOffset((s) => s + 7)}
              className="p-1.5 rounded-md hover:bg-white text-slate-700"
              title="+7 jours"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Horizon Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            {([7, 14, 30] as Horizon[]).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  horizon === h ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {h}J
              </button>
            ))}
          </div>

          {/* Density Selector */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            {(['compact', 'default', 'comfortable'] as Density[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition ${
                  density === d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewGuest(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {lang === 'fr' ? '+ Client' : '+ Guest'}
          </button>
          <button
            type="button"
            onClick={() => setShowNewRes(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {lang === 'fr' ? '+ Nouvelle Réservation' : '+ New Reservation'}
          </button>
        </div>
      </div>

      {/* Unassigned Reservations Strip (Mews style) */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-amber-900 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Réservations non assignées ({unassigned.length}) — Glissez ou cliquez pour attribuer :
          </span>
          {unassigned.map((r) => (
            <button
              key={r.id}
              draggable
              onDragStart={() => setDraggedResId(r.id)}
              onClick={() => onSelectReservation(r.id)}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100 cursor-grab"
            >
              {getGuestName(r.guestId)} ({r.roomType})
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Libre / Inspectée</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Occupée / Arrivée du jour</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> À nettoyer</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Hors service</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded bg-indigo-600" /> Séjour en cours</span>
        </div>
        <span className="text-slate-400 italic">Astuce Mews : glissez-déposez une barre de réservation pour changer de chambre</span>
      </div>

      {/* Collapsible Category Timeline Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <div style={{ minWidth: horizon === 30 ? '1450px' : horizon === 14 ? '1040px' : '820px' }}>
          {/* Header Row */}
          <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <div className="col-span-2 px-4 py-2.5 border-r border-slate-200">
              {lang === 'fr' ? 'Catégorie / Chambre' : 'Category / Space'}
            </div>
            <div
              className="col-span-10 grid"
              style={{ gridTemplateColumns: `repeat(${horizon}, minmax(0, 1fr))` }}
            >
              {days.map((d) => {
                const isToday = d === project.simulatedDate;
                return (
                  <div
                    key={d}
                    className={`py-2 text-center border-r border-slate-100 last:border-r-0 ${
                      isToday ? 'bg-indigo-50 text-indigo-700 font-bold' : ''
                    }`}
                  >
                    <div className="text-[11px]">{d.slice(5)}</div>
                    {isToday && <div className="text-[9px] uppercase tracking-wider">Auj.</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grouped by RoomType */}
          {roomTypes.map((type) => {
            const typeRooms = project.rooms.filter((r) => r.type === type);
            const isCollapsed = Boolean(collapsedTypes[type]);
            return (
              <div key={type} className="border-b border-slate-200 last:border-b-0">
                {/* Category Summary Row with Daily Availability Counters */}
                <div className="grid grid-cols-12 bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-800">
                  <button
                    type="button"
                    onClick={() => setCollapsedTypes({ ...collapsedTypes, [type]: !isCollapsed })}
                    className="col-span-2 px-3 py-2 border-r border-slate-200 flex items-center justify-between hover:bg-slate-200/60 text-left"
                  >
                    <span className="flex items-center gap-1.5">
                      {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                      {type}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">{typeRooms.length} ch.</span>
                  </button>
                  <div
                    className="col-span-10 grid"
                    style={{ gridTemplateColumns: `repeat(${horizon}, minmax(0, 1fr))` }}
                  >
                    {days.map((d) => {
                      const avail = getCategoryAvailable(type, d);
                      return (
                        <div
                          key={d}
                          className={`py-2 text-center text-[11px] border-r border-slate-200/70 last:border-r-0 tabular-nums ${
                            avail === 0 ? 'text-red-600 bg-red-50/60' : 'text-emerald-700'
                          }`}
                          title={`${avail} disponible(s)`}
                        >
                          {avail}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Room Rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {typeRooms.map((room) => {
                      const roomRes = project.reservations.filter(
                        (r) => r.roomId === room.id && r.status !== 'cancelled' && r.status !== 'no_show'
                      );
                      const isDropTarget = dragOverRoomId === room.id;

                      return (
                        <div
                          key={room.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverRoomId(room.id);
                          }}
                          onDragLeave={() => setDragOverRoomId(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverRoomId(null);
                            if (draggedResId && room.status !== 'out_of_order') {
                              onMoveReservationRoom(draggedResId, room.id);
                            }
                            setDraggedResId(null);
                          }}
                          className={`grid grid-cols-12 ${rowHeight} items-center transition ${
                            isDropTarget ? 'bg-indigo-100/70 ring-1 ring-inset ring-indigo-500' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="col-span-2 px-4 h-full border-r border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${statusDot(room.status)}`} />
                              <span className="font-bold text-slate-800 text-xs">{room.number}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {room.maxGuests ?? 2}p • {formatMoney(room.baseRate, project.config.currency)}
                            </span>
                          </div>

                          <div
                            className="col-span-10 grid h-full relative"
                            style={{ gridTemplateColumns: `repeat(${horizon}, minmax(0, 1fr))` }}
                          >
                            {days.map((d) => (
                              <div
                                key={d}
                                className={`h-full border-r border-slate-100 last:border-r-0 ${
                                  d === project.simulatedDate ? 'bg-indigo-50/30' : ''
                                }`}
                              />
                            ))}

                            {roomRes.map((res) => {
                              const firstDay = days[0];
                              const lastDay = days[days.length - 1];
                              if (res.checkOut <= firstDay || res.checkIn > lastDay) return null;

                              const startIdx = days.findIndex((d) => d >= res.checkIn);
                              const effectiveStart = res.checkIn < firstDay ? 0 : startIdx;
                              if (effectiveStart === -1) return null;

                              const nights = diffNights(
                                res.checkIn < firstDay ? firstDay : res.checkIn,
                                res.checkOut > addDays(lastDay, 1) ? addDays(lastDay, 1) : res.checkOut
                              );
                              const spanCols = Math.min(horizon - effectiveStart, Math.max(1, nights));
                              const leftPct = (effectiveStart / horizon) * 100;
                              const widthPct = (spanCols / horizon) * 100;

                              return (
                                <button
                                  key={res.id}
                                  type="button"
                                  draggable
                                  onDragStart={() => setDraggedResId(res.id)}
                                  onClick={() => onSelectReservation(res.id)}
                                  style={{ left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
                                  className={`absolute top-1.5 bottom-1.5 rounded-md border px-2 text-left text-[11px] font-semibold truncate shadow-xs hover:brightness-110 transition flex items-center justify-between cursor-grab active:cursor-grabbing ${resBarColor(
                                    res
                                  )}`}
                                  title={`${getGuestName(res.guestId)} (${res.checkIn} → ${res.checkOut}) — Glisser pour déplacer`}
                                >
                                  <span className="truncate">{getGuestName(res.guestId)}</span>
                                  {res.groupName && (
                                    <span className="ml-1 px-1 rounded bg-black/20 text-[9px] shrink-0">GRP</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Waitlist & Directory Quick Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {lang === 'fr' ? `Liste d'attente (${waitlist.length})` : `Waitlist (${waitlist.length})`}
          </h3>
          {waitlist.length === 0 ? (
            <p className="text-xs text-slate-400">Aucune demande en liste d’attente.</p>
          ) : (
            <div className="space-y-2">
              {waitlist.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectReservation(w.id)}
                  className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between cursor-pointer text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{getGuestName(w.guestId)}</span>
                    <span className="text-slate-600 ml-2">
                      {w.roomType} • {w.checkIn} → {w.checkOut}
                    </span>
                  </div>
                  <span className="font-semibold text-amber-700">Attribuer →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            {lang === 'fr' ? `Répertoire Clients (${project.guests.length})` : `Guest Directory (${project.guests.length})`}
          </h3>
          <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
            {project.guests.map((g) => (
              <div key={g.id} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">
                    {g.firstName} {g.lastName}
                  </span>
                  <span className="text-slate-500 ml-2">{g.nationality} • {g.idNumber || 'ID n/a'}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">{g.vipStatus}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal New Guest */}
      {showNewGuest && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveGuest} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'fr' ? 'Nouvelle Fiche Client' : 'New Guest Profile'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Prénom *" value={gFirst} onChange={(e) => setGFirst(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
              <input required placeholder="Nom *" value={gLast} onChange={(e) => setGLast(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Email" value={gEmail} onChange={(e) => setGEmail(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
              <input placeholder="Téléphone" value={gPhone} onChange={(e) => setGPhone(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nationalité" value={gNat} onChange={(e) => setGNat(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
              <input placeholder="N° Passeport / CNI" value={gIdNum} onChange={(e) => setGIdNum(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
            </div>
            <select value={gVip} onChange={(e) => setGVip(e.target.value as Guest['vipStatus'])} className="w-full px-3 py-2 border rounded-lg text-xs bg-white">
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Corporate">Corporate</option>
            </select>
            <input placeholder="Préférences (chambre calme, régime...)" value={gPref} onChange={(e) => setGPref(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewGuest(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">Annuler</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal New Reservation */}
      {showNewRes && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveReservation} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-3 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'fr' ? 'Nouvelle Réservation' : 'New Reservation'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Client</label>
                <select value={rGuestId} onChange={(e) => setRGuestId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  {project.guests.map((g) => (
                    <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Statut</label>
                <select value={rStatus} onChange={(e) => setRStatus(e.target.value as 'confirmed' | 'waitlist')} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  <option value="confirmed">Confirmée</option>
                  <option value="waitlist">Liste d’attente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Arrivée</label>
                <input type="date" value={rCheckIn} onChange={(e) => setRCheckIn(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs mt-0.5" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Départ</label>
                <input type="date" value={rCheckOut} onChange={(e) => setRCheckOut(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs mt-0.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Catégorie</label>
                <select value={rRoomType} onChange={(e) => setRRoomType(e.target.value as RoomType)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  {roomTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Chambre attribuée</label>
                <select value={rRoomId} onChange={(e) => setRRoomId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  <option value="">Attribution auto</option>
                  {project.rooms.filter((r) => r.type === rRoomType && r.status !== 'out_of_order').map((r) => (
                    <option key={r.id} value={r.id}>Ch. {r.number} ({formatMoney(r.baseRate, project.config.currency)})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Plan tarifaire</label>
                <select value={rRatePlanId} onChange={(e) => setRRatePlanId(e.target.value)} className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  {project.config.ratePlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Canal</label>
                <select value={rChannel} onChange={(e) => setRChannel(e.target.value as SalesChannel)} className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  {project.config.activeChannels.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Garantie</label>
                <select value={rGuarantee} onChange={(e) => setRGuarantee(e.target.value as Reservation['guaranteeType'])} className="w-full px-2.5 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  <option value="card">Carte</option>
                  <option value="deposit">Acompte</option>
                  <option value="prepaid">Prépaiement</option>
                  <option value="none">Aucune</option>
                </select>
              </div>
            </div>

            {project.config.modules.housekeepingMode === 'optional_guest_choice' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Option Ménage (au choix du client)</label>
                <select value={rHousekeeping} onChange={(e) => setRHousekeeping(e.target.value as Reservation['housekeepingChoice'])} className="w-full px-3 py-2 border rounded-lg text-xs bg-white mt-0.5">
                  <option value="requested">Ménage quotidien souhaité</option>
                  <option value="declined">Ménage refusé (Éco-responsable)</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nom du groupe (optionnel)" value={rGroup} onChange={(e) => setRGroup(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
              <input placeholder="Demandes spéciales" value={rNotes} onChange={(e) => setRNotes(e.target.value)} className="px-3 py-2 border rounded-lg text-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewRes(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">Annuler</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">Créer la réservation</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
