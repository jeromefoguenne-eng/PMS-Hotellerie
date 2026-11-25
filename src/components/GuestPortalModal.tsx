import React, { useState } from 'react';
import { Smartphone, CheckCircle2, Sparkles, X } from 'lucide-react';
import type { HotelProject, Reservation } from '../types/pms';

interface GuestPortalModalProps {
  project: HotelProject;
  onClose: () => void;
  onCompleteOnlineCheckIn: (resId: string, housekeepingChoice: Reservation['housekeepingChoice'], idNumber: string) => void;
}

export const GuestPortalModal: React.FC<GuestPortalModalProps> = ({
  project,
  onClose,
  onCompleteOnlineCheckIn,
}) => {
  const pendingArrivals = project.reservations.filter((r) => r.status === 'confirmed');
  const [selectedResId, setSelectedResId] = useState(pendingArrivals[0]?.id || '');
  const [idNum, setIdNum] = useState('');
  const [hkChoice, setHkChoice] = useState<Reservation['housekeepingChoice']>('requested');
  const [signed, setSigned] = useState(false);
  const [done, setDone] = useState(false);

  const res = pendingArrivals.find((r) => r.id === selectedResId);
  const guest = project.guests.find((g) => g.id === res?.guestId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-bold text-sm">Mews Guest Portal — Check-in en ligne</div>
              <div className="text-[11px] text-slate-400">{project.config.hotelName}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {pendingArrivals.length === 0 ? (
            <p className="text-slate-500 text-center py-6">
              Aucune réservation confirmée en attente de check-in en ligne.
            </p>
          ) : done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-base font-bold text-slate-900">Check-in en ligne validé !</div>
              <p className="text-slate-500">
                La fiche de police est signée et la clé digitale est prête. Le statut est mis à jour dans le PMS.
              </p>
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">
                Fermer
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="font-semibold text-slate-700">Sélectionner la réservation</label>
                <select
                  value={selectedResId}
                  onChange={(e) => setSelectedResId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-slate-50 font-semibold"
                >
                  {pendingArrivals.map((r) => {
                    const g = project.guests.find((x) => x.id === r.guestId);
                    return (
                      <option key={r.id} value={r.id}>
                        {r.reference} — {g?.firstName} {g?.lastName} ({r.checkIn})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">N° Passeport / CNI (Fiche de police)</label>
                <input
                  value={idNum || guest?.idNumber || ''}
                  onChange={(e) => setIdNum(e.target.value)}
                  placeholder="Ex: BJ-9948210"
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>

              {project.config.modules.housekeepingMode === 'optional_guest_choice' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" /> Préférence Ménage
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHkChoice('requested')}
                      className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                        hkChoice === 'requested' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      Ménage quotidien
                    </button>
                    <button
                      type="button"
                      onClick={() => setHkChoice('declined')}
                      className={`flex-1 py-1.5 rounded-lg border font-semibold ${
                        hkChoice === 'declined' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      Éco (Sans ménage)
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 p-3 rounded-lg border bg-slate-50 cursor-pointer font-medium">
                <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} />
                <span>Je confirme mon identité et signe électroniquement la fiche d’enregistrement.</span>
              </label>

              <button
                type="button"
                disabled={!signed || !res}
                onClick={() => {
                  if (!res) return;
                  onCompleteOnlineCheckIn(res.id, hkChoice, idNum || guest?.idNumber || '');
                  setDone(true);
                }}
                className="w-full py-2.5 rounded-lg bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 text-white font-semibold"
              >
                Valider le Self Check-in ✓
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
