import React, { useState } from 'react';
import { Sparkles, Wrench, Package, ShoppingCart, Plus } from 'lucide-react';
import type { HotelProject, Language, RoomStatus } from '../types/pms';
import { formatMoney } from '../lib/format';

interface HousekeepingInventoryViewProps {
  mode: 'housekeeping' | 'inventory';
  project: HotelProject;
  lang: Language;
  onUpdateRoomStatus: (roomId: string, status: RoomStatus) => void;
  onAddMaintenanceTicket: (roomId: string, title: string, priority: 'low' | 'medium' | 'high') => void;
  onResolveTicket: (ticketId: string) => void;
  onSellCatalogItemToRoom: (itemId: string, resId: string, qty: number) => void;
  onRestockItem: (itemId: string, qty: number) => void;
}

export const HousekeepingInventoryView: React.FC<HousekeepingInventoryViewProps> = ({
  mode,
  project,
  lang,
  onUpdateRoomStatus,
  onAddMaintenanceTicket,
  onResolveTicket,
  onSellCatalogItemToRoom,
  onRestockItem,
}) => {
  const [ticketRoomId, setTicketRoomId] = useState(project.rooms[0]?.id || '');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const inHouse = project.reservations.filter((r) => r.status === 'checked_in');
  const [selectedResId, setSelectedResId] = useState(inHouse[0]?.id || '');

  if (mode === 'housekeeping') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {lang === 'fr' ? 'Module Gouvernante & Maintenance' : 'Housekeeping & Maintenance'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mode ménage configuré :{' '}
              <strong>
                {project.config.modules.housekeepingMode === 'optional_guest_choice'
                  ? 'Optionnel (au choix du client)'
                  : project.config.modules.housekeepingMode === 'included'
                  ? 'Inclus automatiquement'
                  : 'Désactivé'}
              </strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {project.rooms.map((room) => {
            const stay = project.reservations.find((r) => r.roomId === room.id && r.status === 'checked_in');
            return (
              <div key={room.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Chambre {room.number}</span>
                  <span className="text-[11px] text-slate-500">{room.type}</span>
                </div>
                {stay && project.config.modules.housekeepingMode === 'optional_guest_choice' && (
                  <div
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded inline-block ${
                      stay.housekeepingChoice === 'declined'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {stay.housekeepingChoice === 'declined' ? 'Ménage refusé (Éco)' : 'Ménage demandé'}
                  </div>
                )}
                <select
                  value={room.status}
                  onChange={(e) => onUpdateRoomStatus(room.id, e.target.value as RoomStatus)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50"
                >
                  <option value="available">Libre & Propre</option>
                  <option value="inspected">Inspectée (Prête)</option>
                  <option value="occupied">Occupée</option>
                  <option value="dirty">À nettoyer</option>
                  <option value="cleaning">En nettoyage</option>
                  <option value="out_of_order">Hors service</option>
                </select>
                <div className="text-[11px] text-slate-400">Gouvernante : {room.assignedHousekeeper || 'Non assignée'}</div>
              </div>
            );
          })}
        </div>

        {/* Maintenance Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-red-500" />
            Bons de travaux & Maintenance
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!ticketTitle.trim()) return;
              onAddMaintenanceTicket(ticketRoomId, ticketTitle.trim(), ticketPriority);
              setTicketTitle('');
            }}
            className="flex flex-wrap gap-2"
          >
            <select value={ticketRoomId} onChange={(e) => setTicketRoomId(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white">
              {project.rooms.map((r) => (
                <option key={r.id} value={r.id}>Ch. {r.number}</option>
              ))}
            </select>
            <input
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              placeholder="Décrire la panne (ex: Fuite lavabo, Clim...)"
              className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-xs"
            />
            <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value as 'low' | 'medium' | 'high')} className="px-3 py-2 border rounded-lg text-xs bg-white">
              <option value="low">Priorité Basse</option>
              <option value="medium">Priorité Moyenne</option>
              <option value="high">Haute (Bloque la chambre)</option>
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Signaler
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs">
            {project.maintenanceTickets.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">Ch. {t.roomNumber}</span> — {t.title}{' '}
                  <span className="text-slate-400">({t.reportedAt})</span>
                </div>
                {t.status !== 'resolved' ? (
                  <button
                    onClick={() => onResolveTicket(t.id)}
                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100"
                  >
                    Marquer résolu
                  </button>
                ) : (
                  <span className="text-emerald-600 font-semibold">Résolu ✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Inventory & POS Bar / Room Service
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            {lang === 'fr' ? 'Stocks & Point de Vente (Bar / Room Service / Minibar)' : 'Inventory & POS'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Les ventes imputées sur une chambre s’ajoutent automatiquement au folio et décrémentent le stock.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">Chambre cible (POS) :</span>
          <select
            value={selectedResId}
            onChange={(e) => setSelectedResId(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-slate-50 font-semibold"
          >
            {inHouse.length === 0 && <option value="">Aucun client en séjour</option>}
            {inHouse.map((r) => {
              const rm = project.rooms.find((x) => x.id === r.roomId);
              const g = project.guests.find((x) => x.id === r.guestId);
              return (
                <option key={r.id} value={r.id}>
                  Ch. {rm?.number} — {g?.firstName} {g?.lastName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b">
            <tr>
              <th className="text-left p-3.5">Article</th>
              <th className="text-left p-3.5">Catégorie</th>
              <th className="text-right p-3.5">Prix Vente</th>
              <th className="text-right p-3.5">Stock Actuel</th>
              <th className="text-right p-3.5">Vendus</th>
              <th className="text-right p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {project.catalog.map((item) => {
              const isLow = item.stockQty <= item.minThreshold;
              const isSellable = item.unitPrice > 0;
              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3.5 uppercase text-[10px] font-bold text-slate-500">{item.category}</td>
                  <td className="p-3.5 text-right tabular-nums">
                    {isSellable ? formatMoney(item.unitPrice, project.config.currency) : 'Usage interne'}
                  </td>
                  <td className={`p-3.5 text-right font-bold tabular-nums ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                    {item.stockQty} {isLow && '(Alerte !)'}
                  </td>
                  <td className="p-3.5 text-right tabular-nums text-slate-600">{item.soldCount}</td>
                  <td className="p-3.5 text-right space-x-2">
                    {isSellable && selectedResId && (
                      <button
                        onClick={() => onSellCatalogItemToRoom(item.id, selectedResId, 1)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" /> Imputer Folio
                      </button>
                    )}
                    <button
                      onClick={() => onRestockItem(item.id, 20)}
                      className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
                    >
                      +20 Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
