import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Star,
  Download,
  CalendarRange,
  Save,
  Smile,
  Frown,
  Meh,
  Plus,
} from 'lucide-react';
import type { Guest, GuestExperience, HotelProject, Language } from '../types/pms';
import { downloadCSV, formatMoney } from '../lib/format';

interface GuestCrmViewProps {
  project: HotelProject;
  lang: Language;
  actorName: string;
  onCreateGuest: (guest: Omit<Guest, 'id' | 'loyaltyPoints'>) => Guest;
  onUpdateGuest: (guestId: string, patch: Partial<Guest>) => void;
  onSelectReservation: (resId: string) => void;
}

export const GuestCrmView: React.FC<GuestCrmViewProps> = ({
  project,
  lang,
  actorName,
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

  // New experience form
  const [expType, setExpType] = useState<GuestExperience['type']>('positive');
  const [expSummary, setExpSummary] = useState('');
  const [expResolution, setExpResolution] = useState('');

  const filteredGuests = project.guests.filter((g) => {
    if (vipFilter !== 'ALL' && g.vipStatus !== vipFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.idNumber.toLowerCase().includes(q) ||
        (g.company || '').toLowerCase().includes(q)
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
      ['Prénom', 'Nom', 'E-mail', 'Téléphone', 'Nationalité', 'Pièce ID', 'Entreprise', 'Statut VIP', 'Préférences', 'Régime/Allergies', 'Séjours', 'CA Généré'],
    ];
    project.guests.forEach((g) => {
      const st = getGuestStats(g.id);
      rows.push([
        g.firstName,
        g.lastName,
        g.email,
        g.phone,
        g.nationality,
        g.idNumber,
        g.company || '',
        g.vipStatus,
        g.preferences,
        g.dietaryRestrictions || '',
        st.stays.length,
        st.spent,
      ]);
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
      experiences: [],
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

  const handleAddExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest || !expSummary.trim()) return;
    const entry: GuestExperience = {
      id: `exp-${Date.now()}`,
      date: project.simulatedDate,
      type: expType,
      summary: expSummary.trim(),
      resolution: expResolution.trim() || undefined,
      recordedBy: actorName,
    };
    onUpdateGuest(selectedGuest.id, {
      experiences: [entry, ...(selectedGuest.experiences || [])],
    });
    setExpSummary('');
    setExpResolution('');
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
            Données personnelles complètes, préférences, régimes et suivi des expériences (plaintes ou avis positifs).
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
            placeholder="Rechercher par nom, société, e-mail, téléphone ou N° passeport..."
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
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredGuests.map((g) => {
              const st = getGuestStats(g.id);
              const active = selectedGuest?.id === g.id;
              const complaints = (g.experiences || []).filter((e) => e.type === 'complaint').length;
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
                    <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                      {g.firstName} {g.lastName}
                      {complaints > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold">
                          {complaints} plainte(s)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {g.company ? `${g.company} • ` : ''}
                      {g.email || 'Sans e-mail'}
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
        <div className="lg:col-span-8 space-y-5">
          {selectedGuest ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedGuest.firstName} {selectedGuest.lastName}
                    </h3>
                    <p className="text-slate-500">
                      {selectedGuest.nationality} • Pièce ID : <strong>{selectedGuest.idNumber || 'Non renseignée'}</strong>
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> {selectedGuest.loyaltyPoints} pts fidélité
                  </span>
                </div>

                {/* Personal Data & Preferences */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-600">E-mail</label>
                    <input
                      value={selectedGuest.email}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { email: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Téléphone</label>
                    <input
                      value={selectedGuest.phone}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { phone: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Date de naissance</label>
                    <input
                      type="date"
                      value={selectedGuest.birthDate || ''}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { birthDate: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">N° Passeport / CNI</label>
                    <input
                      value={selectedGuest.idNumber}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { idNumber: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Entreprise / Organisation</label>
                    <input
                      value={selectedGuest.company || ''}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { company: e.target.value })}
                      placeholder="Ex: UEMOA, HECh..."
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Langue préférée</label>
                    <input
                      value={selectedGuest.preferredLanguage || ''}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { preferredLanguage: e.target.value })}
                      placeholder="Ex: Français, English"
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-600">Adresse postale complète</label>
                    <input
                      value={selectedGuest.address || ''}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { address: e.target.value })}
                      placeholder="Rue, code postal, ville, pays"
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Statut Fidélité</label>
                    <select
                      value={selectedGuest.vipStatus}
                      onChange={(e) =>
                        onUpdateGuest(selectedGuest.id, { vipStatus: e.target.value as Guest['vipStatus'] })
                      }
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg bg-white"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-600">Préférences (chambre, oreiller, étage...)</label>
                    <input
                      value={selectedGuest.preferences}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { preferences: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-600">Allergies / Régime</label>
                    <input
                      value={selectedGuest.dietaryRestrictions || ''}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { dietaryRestrictions: e.target.value })}
                      placeholder="Ex: Sans gluten, arachides..."
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="font-semibold text-slate-600">Notes internes équipe</label>
                    <textarea
                      rows={2}
                      value={selectedGuest.notes}
                      onChange={(e) => onUpdateGuest(selectedGuest.id, { notes: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <Save className="w-3.5 h-3.5" /> Données personnelles & préférences sauvegardées automatiquement.
                </div>
              </div>

              {/* Guest Experiences (Plaintes & Content/Positif) */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">
                  Expériences vécues (Plaintes, Incidents & Retours positifs)
                </h4>

                <form onSubmit={handleAddExperience} className="p-3.5 rounded-xl bg-slate-50 border space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'positive', label: 'Content / Positif', icon: Smile, cls: 'bg-emerald-600 text-white' },
                      { id: 'complaint', label: 'Plainte / Incident', icon: Frown, cls: 'bg-red-600 text-white' },
                      { id: 'neutral', label: 'Remarque neutre', icon: Meh, cls: 'bg-slate-700 text-white' },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = expType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExpType(opt.id as GuestExperience['type'])}
                          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border ${
                            active ? opt.cls : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      required
                      value={expSummary}
                      onChange={(e) => setExpSummary(e.target.value)}
                      placeholder="Décrire l’expérience vécue (ex: Bruit clim, accueil chaleureux...)"
                      className="px-3 py-2 border rounded-lg bg-white"
                    />
                    <input
                      value={expResolution}
                      onChange={(e) => setExpResolution(e.target.value)}
                      placeholder="Action / Résolution (ex: Surclassement, bon boisson offert)"
                      className="px-3 py-2 border rounded-lg bg-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Enregistrer cette expérience
                  </button>
                </form>

                <div className="space-y-2">
                  {(selectedGuest.experiences || []).map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-3 rounded-xl border ${
                        exp.type === 'complaint'
                          ? 'bg-red-50/70 border-red-200'
                          : exp.type === 'positive'
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {exp.type === 'complaint'
                            ? 'Plainte / Incident'
                            : exp.type === 'positive'
                            ? 'Client Content / Positif'
                            : 'Remarque'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {exp.date} • par {exp.recordedBy}
                        </span>
                      </div>
                      <p className="text-slate-800 mt-1">{exp.summary}</p>
                      {exp.resolution && (
                        <p className="text-slate-600 mt-1 italic">Résolution : {exp.resolution}</p>
                      )}
                    </div>
                  ))}
                  {(selectedGuest.experiences || []).length === 0 && (
                    <p className="text-slate-400">Aucune expérience ou plainte enregistrée pour ce client.</p>
                  )}
                </div>
              </div>

              {/* Guest Stays History */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs">
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
            </>
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
