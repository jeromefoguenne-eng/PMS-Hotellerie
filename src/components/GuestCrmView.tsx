import React, { useState } from 'react';
import { Users, Search, UserPlus, Star, Download, CalendarRange, Save } from 'lucide-react';
import type { Guest, HotelProject, Language } from '../types/pms';
import { downloadCSV, formatMoney } from '../lib/format';

interface GuestCrmViewProps {
  project: HotelProject;
  lang: Language;
  onCreateGuest: (guest: Omit<Guest, 'id' | 'loyaltyPoints'>) => Guest;
  onUpdateGuest: (guestId: string, patch: Partial<Guest>) => void;
  onSelectReservation: (resId: string) => void;
}

export const GuestCrmView: React.FC<GuestCrmViewProps> = ({
  project,
  lang,
  onCreateGuest,
  onUpdateGuest,
  onSelectReservation,
}) => {
  const [query, setQuery] = useState('');
  const [vipFilter, setVipFilter] = useState<string>('ALL');
  const [selectedGuestId, setSelectedGuestId] = useState<string>(project.guests[0]?.id || '');
  const [showNewModal, setShowNewModal] = useState(false);

  // New guest form
  const [gFirst, setGFirst] = useState('');
  const [gLast, setGLast] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gPhone, setGPhone] = useState('');
  const [gNat, setGNat] = useState('Béninoise');
  const [gIdNum, setGIdNum] = useState('');
  const [gVip, setGVip] = useState<Guest['vipStatus']>('Standard');
  const [gPref, setGPref] = useState('');

  const filteredGuests = project.guests.filter((g) => {
    if (vipFilter !== 'ALL' && g.vipStatus !== vipFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.idNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedGuest = project.guests.find((g) => g.id === selectedGuestId) || filteredGuests[0] || null;

  const getGuestStats = (guestId: string) => {
    const stays = project.reservations.filter((r) => r.guestId === guestId && r.status !== 'cancelled');
    const spent = project.folios
      .filter((f) => f.guestId === guestId)
      .reduce((s, f) => s + f.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0), 0);
    return { stays, spent };
  };

  const handleExportCRM = () => {
    const rows: (string | number)[][] = [
      ['Prénom', 'Nom', 'E-mail', 'Téléphone', 'Nationalité', 'Pièce ID', 'Statut VIP', 'Points Fidélité', 'Séjours', 'CA Généré'],
    ];
    project.guests.forEach((g) => {
      const st = getGuestStats(g.id);
      rows.push([g.firstName, g.lastName, g.email, g.phone, g.nationality, g.idNumber, g.vipStatus, g.loyaltyPoints, st.stays.length, st.spent]);
    });
    downloadCSV(`openhotelpms-crm-clients-${project.simulatedDate}.csv`, rows);
  };

  const handleCreate = (e: React.FormEvent) => {
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
    setSelectedGuestId(created.id);
    setShowNewModal(false);
    setGFirst('');
    setGLast('');
    setGEmail('');
    setGPhone('');
    setGIdNum('');
    setGPref('');
  };

  return (
    <div className="space-y-6">
      {/* CRM Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            {lang === 'fr' ? `CRM Clients & Profils (${project.guests.length})` : `Guest CRM & Profiles (${project.guests.length})`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralisez les fiches clients, préférences, statuts VIP/Corporate, fidélité et historique des séjours.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCRM}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" /> + Nouveau Client
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, e-mail, téléphone ou N° passeport..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
          />
        </div>
        <select
          value={vipFilter}
          onChange={(e) => setVipFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-xs bg-slate-50 font-semibold"
        >
          <option value="ALL">Tous statuts</option>
          <option value="Standard">Standard</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Corporate">Corporate</option>
        </select>
      </div>

      {/* Split Master-Detail CRM Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Guest List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {filteredGuests.map((g) => {
              const st = getGuestStats(g.id);
              const active = selectedGuest?.id === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGuestId(g.id)}
                  className={`w-full text-left p-4 transition flex items-center justify-between ${
                    active ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-sm truncate">
                      {g.firstName} {g.lastName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {g.email || 'Sans e-mail'} • {g.nationality}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {st.stays.length} séjour(s) • {formatMoney(st.spent, project.config.currency)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      g.vipStatus === 'Gold'
                        ? 'bg-amber-100 text-amber-800'
                        : g.vipStatus === 'Corporate'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {g.vipStatus}
                  </span>
                </button>
              );
            })}
            {filteredGuests.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">Aucun client trouvé.</div>
            )}
          </div>
        </div>

        {/* Guest Detail Card */}
        <div className="lg:col-span-7">
          {selectedGuest ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedGuest.firstName} {selectedGuest.lastName}
                  </h3>
                  <p className="text-slate-500">
                    {selectedGuest.nationality} • Pièce ID : <strong>{selectedGuest.idNumber || 'Non renseignée'}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> {selectedGuest.loyaltyPoints} pts
                  </span>
                </div>
              </div>

              {/* Editable CRM Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600">E-mail</label>
                  <input
                    value={selectedGuest.email}
                    onChange={(e) => onUpdateGuest(selectedGuest.id, { email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Téléphone</label>
                  <input
                    value={selectedGuest.phone}
                    onChange={(e) => onUpdateGuest(selectedGuest.id, { phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">N° Passeport / CNI</label>
                  <input
                    value={selectedGuest.idNumber}
                    onChange={(e) => onUpdateGuest(selectedGuest.id, { idNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600">Statut Fidélité / Segment</label>
                  <select
                    value={selectedGuest.vipStatus}
                    onChange={(e) =>
                      onUpdateGuest(selectedGuest.id, { vipStatus: e.target.value as Guest['vipStatus'] })
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-600">Préférences client</label>
                  <input
                    value={selectedGuest.preferences}
                    onChange={(e) => onUpdateGuest(selectedGuest.id, { preferences: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-600">Notes internes équipe</label>
                  <textarea
                    rows={2}
                    value={selectedGuest.notes}
                    onChange={(e) => onUpdateGuest(selectedGuest.id, { notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                <Save className="w-3.5 h-3.5" /> Modifications enregistrées automatiquement dans le CRM.
              </div>

              {/* Guest Stays History */}
              <div className="pt-3 border-t space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <CalendarRange className="w-4 h-4 text-indigo-600" />
                  Historique des séjours & réservations
                </h4>
                <div className="divide-y divide-slate-100">
                  {getGuestStats(selectedGuest.id).stays.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => onSelectReservation(res.id)}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{res.reference}</span>
                        <span className="text-slate-500 ml-2">
                          {res.checkIn} → {res.checkOut} • {res.roomType} ({res.channel})
                        </span>
                      </div>
                      <span className="text-indigo-600 font-semibold">Ouvrir →</span>
                    </div>
                  ))}
                  {getGuestStats(selectedGuest.id).stays.length === 0 && (
                    <p className="text-slate-400 py-2">Aucun séjour enregistré pour ce client.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-xs text-slate-400">
              Sélectionnez un client pour afficher sa fiche CRM.
            </div>
          )}
        </div>
      </div>

      {/* Modal New Guest */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 shadow-xl text-xs">
            <h3 className="text-base font-bold text-slate-900">Nouvelle Fiche Client CRM</h3>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Prénom *" value={gFirst} onChange={(e) => setGFirst(e.target.value)} className="px-3 py-2 border rounded-lg" />
              <input required placeholder="Nom *" value={gLast} onChange={(e) => setGLast(e.target.value)} className="px-3 py-2 border rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="E-mail" value={gEmail} onChange={(e) => setGEmail(e.target.value)} className="px-3 py-2 border rounded-lg" />
              <input placeholder="Téléphone" value={gPhone} onChange={(e) => setGPhone(e.target.value)} className="px-3 py-2 border rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nationalité" value={gNat} onChange={(e) => setGNat(e.target.value)} className="px-3 py-2 border rounded-lg" />
              <input placeholder="N° Passeport / CNI" value={gIdNum} onChange={(e) => setGIdNum(e.target.value)} className="px-3 py-2 border rounded-lg" />
            </div>
            <select value={gVip} onChange={(e) => setGVip(e.target.value as Guest['vipStatus'])} className="w-full px-3 py-2 border rounded-lg bg-white">
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Corporate">Corporate</option>
            </select>
            <input placeholder="Préférences (chambre calme, régime...)" value={gPref} onChange={(e) => setGPref(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-3 py-1.5 rounded-lg border font-semibold">Annuler</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold">Créer fiche</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
