import React, { useState } from 'react';
import { X, LogIn, LogOut, Ban, Printer, PlusCircle, CreditCard, Sparkles } from 'lucide-react';
import type {
  FolioCategory,
  HotelProject,
  Language,
  PaymentMethod,
  Reservation,
} from '../types/pms';
import { formatMoney } from '../lib/format';

interface ReservationDrawerProps {
  project: HotelProject;
  reservationId: string;
  lang: Language;
  onClose: () => void;
  onUpdateReservation: (resId: string, patch: Partial<Reservation>) => void;
  onCheckIn: (resId: string, roomId: string) => void;
  onCheckOut: (resId: string) => void;
  onAddFolioItem: (resId: string, item: { description: string; category: FolioCategory; quantity: number; unitPrice: number; payer: 'guest' | 'company' }) => void;
  onToggleItemPayer: (resId: string, itemId: string) => void;
  onAddPayment: (resId: string, payment: { method: PaymentMethod; amount: number; payer: 'guest' | 'company' }) => void;
}

export const ReservationDrawer: React.FC<ReservationDrawerProps> = ({
  project,
  reservationId,
  lang,
  onClose,
  onUpdateReservation,
  onCheckIn,
  onCheckOut,
  onAddFolioItem,
  onToggleItemPayer,
  onAddPayment,
}) => {
  const [tab, setTab] = useState<'stay' | 'folio' | 'police'>('stay');
  const [extraDesc, setExtraDesc] = useState('Consommation Bar');
  const [extraCat, setExtraCat] = useState<FolioCategory>('bar');
  const [extraPrice, setExtraPrice] = useState(4500);
  const [extraPayer, setExtraPayer] = useState<'guest' | 'company'>('guest');
  const [payMethod, setPayMethod] = useState<PaymentMethod>(project.config.billing.acceptedPayments[0] || 'cash');
  const [payAmount, setPayAmount] = useState(0);
  const [payPayer, setPayPayer] = useState<'guest' | 'company'>('guest');

  const res = project.reservations.find((r) => r.id === reservationId);
  if (!res) return null;
  const guest = project.guests.find((g) => g.id === res.guestId);
  const room = project.rooms.find((r) => r.id === res.roomId);
  const folio = project.folios.find((f) => f.reservationId === res.id);

  const guestTotal = (folio?.items || [])
    .filter((i) => i.payer === 'guest')
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const companyTotal = (folio?.items || [])
    .filter((i) => i.payer === 'company')
    .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const guestPaid = (folio?.payments || [])
    .filter((p) => p.payer === 'guest')
    .reduce((s, p) => s + p.amount, 0);
  const companyPaid = (folio?.payments || [])
    .filter((p) => p.payer === 'company')
    .reduce((s, p) => s + p.amount, 0);

  const totalBalance = guestTotal + companyTotal - (guestPaid + companyPaid);

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                {guest ? `${guest.firstName} ${guest.lastName}` : 'Client'}
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[11px] font-bold">
                {res.reference}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {res.checkIn} → {res.checkOut} • {room ? `Chambre ${room.number}` : res.roomType} • {res.status.toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 px-6 gap-4 text-xs font-semibold">
          <button
            onClick={() => setTab('stay')}
            className={`py-3 border-b-2 ${tab === 'stay' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
          >
            {lang === 'fr' ? 'Séjour & Attribution' : 'Stay & Room'}
          </button>
          <button
            onClick={() => setTab('folio')}
            className={`py-3 border-b-2 ${tab === 'folio' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
          >
            {lang === 'fr' ? 'Folio & Facturation Scindée' : 'Folio & Split Billing'}
          </button>
          <button
            onClick={() => setTab('police')}
            className={`py-3 border-b-2 ${tab === 'police' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
          >
            {lang === 'fr' ? 'Fiche de Police' : 'Police Registration'}
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {tab === 'stay' && (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div><span className="text-slate-500">Canal :</span> <strong>{res.channel}</strong></div>
                <div><span className="text-slate-500">Tarif / nuit :</span> <strong>{formatMoney(res.nightlyRate, project.config.currency)}</strong></div>
                <div><span className="text-slate-500">Pièce ID :</span> <strong>{guest?.idNumber || 'Non renseignée'}</strong></div>
                <div><span className="text-slate-500">Garantie :</span> <strong>{res.guaranteeType}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'fr' ? 'Chambre attribuée (Changement / Upgrade)' : 'Assigned Room (Move / Upgrade)'}
                </label>
                <select
                  value={res.roomId || ''}
                  onChange={(e) => onUpdateReservation(res.id, { roomId: e.target.value, status: res.status === 'waitlist' ? 'confirmed' : res.status })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="">-- Non attribuée --</option>
                  {project.rooms.filter((r) => r.status !== 'out_of_order').map((r) => (
                    <option key={r.id} value={r.id}>
                      Ch. {r.number} ({r.type}) — {r.status}
                    </option>
                  ))}
                </select>
              </div>

              {project.config.modules.housekeepingMode === 'optional_guest_choice' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {lang === 'fr' ? 'Choix Ménage du Client' : 'Guest Housekeeping Preference'}
                  </div>
                  <div className="flex gap-2">
                    {(['requested', 'declined'] as const).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => onUpdateReservation(res.id, { housekeepingChoice: choice })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          res.housekeepingChoice === choice
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {choice === 'requested' ? 'Ménage souhaité' : 'Ménage refusé (Éco)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {res.status === 'confirmed' && res.roomId && (
                  <button
                    onClick={() => onCheckIn(res.id, res.roomId!)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" /> Check-in Client
                  </button>
                )}
                {res.status === 'checked_in' && (
                  <button
                    onClick={() => onCheckOut(res.id)}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Check-out & Libérer Chambre
                  </button>
                )}
                {(res.status === 'confirmed' || res.status === 'waitlist') && (
                  <button
                    onClick={() => onUpdateReservation(res.id, { status: 'no_show' })}
                    className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" /> Marquer No-Show
                  </button>
                )}
              </div>
            </>
          )}

          {tab === 'folio' && (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border">
                  <div className="text-slate-500">Part Client</div>
                  <div className="font-bold text-slate-900 mt-0.5">{formatMoney(guestTotal - guestPaid, project.config.currency)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border">
                  <div className="text-slate-500">Part Entreprise</div>
                  <div className="font-bold text-indigo-700 mt-0.5">{formatMoney(companyTotal - companyPaid, project.config.currency)}</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-amber-800">Solde Total</div>
                  <div className="font-bold text-amber-900 mt-0.5">{formatMoney(totalBalance, project.config.currency)}</div>
                </div>
              </div>

              {/* Folio Items */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="text-left p-2.5">Prestation</th>
                      <th className="text-right p-2.5">Total</th>
                      {project.config.billing.allowSplitBilling && <th className="text-center p-2.5">Payeur</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(folio?.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5">
                          <div className="font-medium text-slate-900">{item.description}</div>
                          <div className="text-[10px] text-slate-400">{item.date} • {item.category}</div>
                        </td>
                        <td className="p-2.5 text-right font-semibold tabular-nums">
                          {formatMoney(item.quantity * item.unitPrice, project.config.currency)}
                        </td>
                        {project.config.billing.allowSplitBilling && (
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleItemPayer(res.id, item.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.payer === 'company' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.payer === 'company' ? 'Entreprise' : 'Client'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quick Add Configured Packages (Petit-déj, Spa, Formules) */}
              {(project.config.packages || []).filter((p) => p.active).length > 0 && (
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                  <div className="text-xs font-bold text-indigo-900">Formules & Packages configurés</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(project.config.packages || [])
                      .filter((p) => p.active)
                      .map((pkg) => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() =>
                            onAddFolioItem(res.id, {
                              description: pkg.name,
                              category: pkg.category === 'spa' ? 'spa' : pkg.category === 'breakfast' || pkg.category === 'dining' ? 'restaurant' : 'extra',
                              quantity: 1,
                              unitPrice: pkg.price,
                              payer: 'guest',
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-[11px] font-semibold text-indigo-800 transition"
                        >
                          + {pkg.name} ({formatMoney(pkg.price, project.config.currency)})
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Add Extra / Credit */}
              <div className="p-3.5 rounded-xl bg-slate-50 border space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-600" /> Ajouter un poste / Avoir
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={extraDesc} onChange={(e) => setExtraDesc(e.target.value)} className="px-2.5 py-1.5 border rounded-lg text-xs bg-white" />
                  <select value={extraCat} onChange={(e) => setExtraCat(e.target.value as FolioCategory)} className="px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                    {project.config.modules.barAndFood && <option value="bar">Bar / Restauration</option>}
                    {project.config.modules.roomService && <option value="room_service">Room Service</option>}
                    {project.config.modules.minibar && <option value="minibar">Minibar</option>}
                    {project.config.modules.spa && <option value="spa">Spa</option>}
                    {project.config.modules.parking && <option value="parking">Parking</option>}
                    <option value="extra">Extra divers</option>
                    {project.config.billing.allowDiscountsAndCredits && <option value="discount">Remise / Avoir (négatif)</option>}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="number" value={extraPrice} onChange={(e) => setExtraPrice(Number(e.target.value))} className="w-32 px-2.5 py-1.5 border rounded-lg text-xs bg-white" />
                  <select value={extraPayer} onChange={(e) => setExtraPayer(e.target.value as 'guest' | 'company')} className="px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                    <option value="guest">Client</option>
                    <option value="company">Entreprise</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      onAddFolioItem(res.id, {
                        description: extraDesc,
                        category: extraCat,
                        quantity: 1,
                        unitPrice: extraCat === 'discount' ? -Math.abs(extraPrice) : extraPrice,
                        payer: extraPayer,
                      })
                    }
                    className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Record Payment */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Encaisser un règlement
                </div>
                <div className="flex flex-wrap gap-2">
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} className="px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                    {project.config.billing.acceptedPayments.map((m) => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Montant"
                    value={payAmount || totalBalance}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-32 px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                  />
                  <select value={payPayer} onChange={(e) => setPayPayer(e.target.value as 'guest' | 'company')} className="px-2.5 py-1.5 border rounded-lg text-xs bg-white">
                    <option value="guest">Client</option>
                    <option value="company">Entreprise</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const amt = payAmount > 0 ? payAmount : Math.max(0, totalBalance);
                      if (amt > 0) onAddPayment(res.id, { method: payMethod, amount: amt, payer: payPayer });
                    }}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Encaisser
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'police' && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <strong className="text-sm uppercase tracking-wide">Fiche de Police Simulée</strong>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="no-print px-2.5 py-1 rounded bg-slate-800 text-white flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Établissement : <strong>{project.config.hotelName}</strong></div>
                <div>Référence : <strong>{res.reference}</strong></div>
                <div>Nom : <strong>{guest?.lastName}</strong></div>
                <div>Prénom : <strong>{guest?.firstName}</strong></div>
                <div>Nationalité : <strong>{guest?.nationality}</strong></div>
                <div>N° Pièce d’identité : <strong>{guest?.idNumber || 'À compléter'}</strong></div>
                <div>Date d’arrivée : <strong>{res.checkIn}</strong></div>
                <div>Date de départ : <strong>{res.checkOut}</strong></div>
                <div>Chambre : <strong>{room?.number || 'Non attribuée'}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
