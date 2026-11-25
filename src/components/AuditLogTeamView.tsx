import React, { useState } from 'react';
import { History, Users, UserPlus, Download, Search, Trash2 } from 'lucide-react';
import type { HotelProject, Language, ProjectCollaborator } from '../types/pms';
import { downloadCSV } from '../lib/format';

interface AuditLogTeamViewProps {
  project: HotelProject;
  lang: Language;
  onAddCollaborator: (collab: Omit<ProjectCollaborator, 'addedAt'>) => void;
  onRemoveCollaborator: (email: string) => void;
}

export const AuditLogTeamView: React.FC<AuditLogTeamViewProps> = ({
  project,
  lang,
  onAddCollaborator,
  onRemoveCollaborator,
}) => {
  const [filterActor, setFilterActor] = useState('ALL');
  const [filterCat, setFilterCat] = useState('ALL');
  const [query, setQuery] = useState('');

  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cRole, setCRole] = useState<ProjectCollaborator['role']>('reception');

  const logs = project.actionLog || [];
  const collaborators = project.collaborators || [];
  const actors = Array.from(new Set(logs.map((l) => l.actorName)));

  const filteredLogs = logs.filter((l) => {
    if (filterActor !== 'ALL' && l.actorName !== filterActor) return false;
    if (filterCat !== 'ALL' && l.category !== filterCat) return false;
    if (
      query.trim() &&
      !l.action.toLowerCase().includes(query.toLowerCase()) &&
      !l.details.toLowerCase().includes(query.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const exportLogCSV = () => {
    const rows: (string | number)[][] = [['Date/Heure', 'Employé / Utilisateur', 'E-mail', 'Catégorie', 'Action', 'Détails']];
    filteredLogs.forEach((l) => {
      rows.push([l.timestamp, l.actorName, l.actorEmail, l.category, l.action, l.details]);
    });
    downloadCSV(`open-hotel-pms-audit-${project.id}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Action Audit Log Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            {lang === 'fr' ? 'Historique des Actions & Traçabilité Employés (Audit Log)' : 'Employee Action History (Audit Log)'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chaque réservation, check-in, modification de facture, paiement ou changement de statut est enregistré avec l’identité de l’employé.
          </p>
        </div>
        <button
          onClick={exportLogCSV}
          className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 self-start"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par action, chambre, client..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
          />
        </div>
        <select value={filterActor} onChange={(e) => setFilterActor(e.target.value)} className="px-3 py-1.5 rounded-lg border text-xs bg-slate-50">
          <option value="ALL">Tous les employés</option>
          {actors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-1.5 rounded-lg border text-xs bg-slate-50">
          <option value="ALL">Toutes catégories</option>
          <option value="reservation">Réservations</option>
          <option value="front_desk">Réception (Check-in/out)</option>
          <option value="billing">Facturation & Caisse</option>
          <option value="housekeeping">Gouvernante & Maintenance</option>
          <option value="inventory">Stocks & POS</option>
          <option value="config">Paramétrage</option>
          <option value="team">Équipe</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b sticky top-0">
              <tr>
                <th className="text-left p-3">Date & Heure</th>
                <th className="text-left p-3">Employé</th>
                <th className="text-left p-3">Catégorie</th>
                <th className="text-left p-3">Action posée</th>
                <th className="text-left p-3">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 tabular-nums whitespace-nowrap">
                    {l.timestamp.slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{l.actorName}</div>
                    <div className="text-[10px] text-slate-400">{l.actorEmail}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                      {l.category}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-indigo-700">{l.action}</td>
                  <td className="p-3 text-slate-600">{l.details}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Aucune action enregistrée pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Employee / Shared Project Access */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Équipe & Accès partagé sur cet hôtel ({collaborators.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajoutez vos réceptionnistes, gouvernantes ou comptables pour qu’ils accèdent au même projet depuis leur PC, tablette ou smartphone (synchronisation activée avec Supabase Cloud).
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!cName.trim() || !cEmail.trim()) return;
            onAddCollaborator({ name: cName.trim(), email: cEmail.trim(), role: cRole });
            setCName('');
            setCEmail('');
          }}
          className="flex flex-wrap gap-2 items-center"
        >
          <input
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            placeholder="Nom de l'employé"
            className="px-3 py-2 border rounded-lg text-xs flex-1 min-w-[160px]"
          />
          <input
            type="email"
            value={cEmail}
            onChange={(e) => setCEmail(e.target.value)}
            placeholder="E-mail de connexion"
            className="px-3 py-2 border rounded-lg text-xs flex-1 min-w-[180px]"
          />
          <select
            value={cRole}
            onChange={(e) => setCRole(e.target.value as ProjectCollaborator['role'])}
            className="px-3 py-2 border rounded-lg text-xs bg-white"
          >
            <option value="reception">Réception</option>
            <option value="housekeeping">Gouvernante</option>
            <option value="accounting">Comptabilité</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" /> Ajouter l'employé
          </button>
        </form>

        <div className="divide-y divide-slate-100 text-xs">
          {collaborators.map((c) => (
            <div key={c.email} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{c.name}</span>
                <span className="text-slate-500 ml-2">{c.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold uppercase text-[10px]">
                  {c.role}
                </span>
                <button
                  onClick={() => onRemoveCollaborator(c.email)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                  title="Retirer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
