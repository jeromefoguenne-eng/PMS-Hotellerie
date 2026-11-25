import React from 'react';
import { LogIn, LogOut, Receipt, Moon, Download } from 'lucide-react';
import type { HotelProject, Language } from '../types/pms';
import { downloadCSV, formatMoney } from '../lib/format';

interface FrontDeskBillingViewProps {
  mode: 'frontDesk' | 'billing';
  project: HotelProject;
  lang: Language;
  onSelectReservation: (resId: string) => void;
  onRunNightAudit: () => void;
}

export const FrontDeskBillingView: React.FC<FrontDeskBillingViewProps> = ({
  mode,
  project,
  lang,
  onSelectReservation,
  onRunNightAudit,
}) => {
  const getGuestName = (id: string) => {
    const g = project.guests.find((x) => x.id === id);
    return g ? `${g.firstName} ${g.lastName}` : 'Client';
  };
  const getRoomNumber = (id?: string) => project.rooms.find((r) => r.id === id)?.number || '—';

  if (mode === 'frontDesk') {
    const arrivals = project.reservations.filter((r) => r.status === 'confirmed');
    const inHouse = project.reservations.filter((r) => r.status === 'checked_in');
    const history = project.reservations.filter((r) => r.status === 'checked_out' || r.status === 'no_show');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-blue-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LogIn className="w-4 h-4 text-blue-600" />
                {lang === 'fr' ? `Arrivées attendues (${arrivals.length})` : `Expected Arrivals (${arrivals.length})`}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {arrivals.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectReservation(r.id)}
                  className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{getGuestName(r.guestId)}</div>
                    <div className="text-slate-500">
                      {r.reference} • {r.checkIn} → {r.checkOut} • Ch. {getRoomNumber(r.roomId)} ({r.roomType})
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Check-in →</span>
                </div>
              ))}
              {arrivals.length === 0 && <div className="p-6 text-xs text-slate-400 text-center">Aucune arrivée en attente.</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-indigo-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <LogOut className="w-4 h-4 text-indigo-600" />
                {lang === 'fr' ? `Clients en séjour / Départs (${inHouse.length})` : `In-House & Departures (${inHouse.length})`}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {inHouse.map((r) => (
                <div
                  key={r.id}
                  onClick={() => onSelectReservation(r.id)}
                  className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      Ch. {getRoomNumber(r.roomId)} — {getGuestName(r.guestId)}
                    </div>
                    <div className="text-slate-500">
                      Départ prévu : {r.checkOut} • Ménage : {r.housekeepingChoice === 'declined' ? 'Refusé (Éco)' : 'Inclus/Demandé'}
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold">Gérer / Check-out →</span>
                </div>
              ))}
              {inHouse.length === 0 && <div className="p-6 text-xs text-slate-400 text-center">Aucun client en séjour.</div>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Historique récent (Check-out / No-Show)</h3>
          <div className="space-y-1.5 text-xs">
            {history.map((r) => (
              <div key={r.id} onClick={() => onSelectReservation(r.id)} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer">
                <span><strong>{r.reference}</strong> — {getGuestName(r.guestId)} ({r.checkIn} → {r.checkOut})</span>
                <span className="uppercase font-semibold text-slate-500">{r.status}</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-slate-400">Aucun historique pour le moment.</p>}
          </div>
        </div>
      </div>
    );
  }

  // Billing & Night Audit view
  const exportFoliosCSV = () => {
    const rows: (string | number)[][] = [['Référence', 'Client', 'Total Facturé', 'Encaissé', 'Solde', 'Statut']];
    project.folios.forEach((f) => {
      const res = project.reservations.find((r) => r.id === f.reservationId);
      const total = f.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const paid = f.payments.reduce((s, p) => s + p.amount, 0);
      rows.push([res?.reference || f.id, getGuestName(f.guestId), total, paid, total - paid, f.isClosed ? 'Clôturé' : 'Ouvert']);
    });
    downloadCSV(`openpms-folios-${project.simulatedDate}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            {lang === 'fr' ? 'Facturation, Folios & Night Audit' : 'Billing, Folios & Night Audit'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            TVA {project.config.billing.vatRate}% • Taxe séjour {formatMoney(project.config.billing.cityTaxPerNight, project.config.currency)}/nuit •{' '}
            {project.config.billing.allowSplitBilling ? 'Facturation scindée active' : 'Facture unique'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportFoliosCSV}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={onRunNightAudit}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Moon className="w-4 h-4 text-amber-400" />
            {lang === 'fr' ? 'Clôturer la journée (Night Audit +1J)' : 'Run Night Audit (+1 Day)'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="text-left p-3.5">Référence</th>
              <th className="text-left p-3.5">Client</th>
              <th className="text-right p-3.5">Total Facturé</th>
              <th className="text-right p-3.5">Encaissé</th>
              <th className="text-right p-3.5">Solde</th>
              <th className="text-right p-3.5">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {project.folios.map((f) => {
              const res = project.reservations.find((r) => r.id === f.reservationId);
              const total = f.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
              const paid = f.payments.reduce((s, p) => s + p.amount, 0);
              const bal = total - paid;
              return (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{res?.reference || f.id}</td>
                  <td className="p-3.5">{getGuestName(f.guestId)}</td>
                  <td className="p-3.5 text-right tabular-nums">{formatMoney(total, project.config.currency)}</td>
                  <td className="p-3.5 text-right tabular-nums text-emerald-700">{formatMoney(paid, project.config.currency)}</td>
                  <td className={`p-3.5 text-right font-bold tabular-nums ${bal > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
                    {formatMoney(bal, project.config.currency)}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => res && onSelectReservation(res.id)}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Ouvrir Folio →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Night Audit History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Journal des Clôtures (Night Audits)</h3>
        <div className="space-y-2 text-xs">
          {project.nightAudits.map((na) => (
            <div key={na.id} className="p-3 rounded-lg bg-slate-50 border flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-slate-900">{na.date}</strong> • Occupation {na.occupancyRate}% • ADR {formatMoney(na.adr, project.config.currency)}
              </div>
              <div className="font-semibold text-indigo-700">
                CA Hébergement : {formatMoney(na.roomRevenue, project.config.currency)} | Extras : {formatMoney(na.extrasRevenue, project.config.currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
