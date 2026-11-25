import React, { useState } from 'react';
import { ShieldAlert, Users, Activity, Download, Database, CheckCircle2, Ban } from 'lucide-react';
import type { Language, MemberAccount, TelemetryEvent } from '../types/pms';
import { downloadCSV, downloadJSON } from '../lib/format';
import { loadCloudConfig, saveCloudConfig } from '../lib/storage';

interface AdminSpaceViewProps {
  lang: Language;
  members: MemberAccount[];
  telemetry: TelemetryEvent[];
  onToggleMemberStatus: (memberId: string) => void;
}

export const AdminSpaceView: React.FC<AdminSpaceViewProps> = ({
  lang,
  members,
  telemetry,
  onToggleMemberStatus,
}) => {
  const [cloudCfg, setCloudCfg] = useState(loadCloudConfig());
  const [cloudSaved, setCloudSaved] = useState(false);

  const totalRoomsBooked = telemetry.reduce((s, t) => s + t.roomsDelta, 0);
  const totalItemsSold = telemetry.reduce((s, t) => s + t.itemsDelta, 0);
  const totalRevenueFCFA = telemetry
    .filter((t) => t.currency === 'FCFA')
    .reduce((s, t) => s + t.revenueDelta, 0);

  const exportStatsCSV = () => {
    const rows: (string | number)[][] = [
      ['Membre', 'Organisation', 'Rôle', 'Statut', 'Charte Acceptée', 'Projets', 'Chambres Réservées', 'Articles Vendus', 'CA Généré'],
    ];
    members.forEach((m) => {
      const mEvents = telemetry.filter((t) => t.memberId === m.id);
      const rooms = mEvents.reduce((s, e) => s + e.roomsDelta, 0);
      const items = mEvents.reduce((s, e) => s + e.itemsDelta, 0);
      const rev = mEvents.reduce((s, e) => s + e.revenueDelta, 0);
      rows.push([
        m.name,
        m.organization,
        m.role,
        m.status,
        m.charterAccepted ? 'Oui' : 'Non',
        m.projects.length,
        rooms,
        items,
        rev,
      ]);
    });
    downloadCSV(`openpms-admin-stats-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            {lang === 'fr' ? 'Espace Administrateur — Gestion des Membres & Télémétrie' : 'Admin Space — Members & Telemetry'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi centralisé des comptes inscrits, de la charte acceptée, des chambres réservées, du CA et des articles vendus.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportStatsCSV}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV Membres
          </button>
          <button
            onClick={() => downloadJSON('openpms-telemetry.json', telemetry)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            Export JSON Télémétrie
          </button>
        </div>
      </div>

      {/* Global Aggregated KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Membres inscrits</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{members.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Chambres réservées (Global)</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{totalRoomsBooked}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Éléments vendus (Bar/RS)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalItemsSold}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">CA Cumulé (FCFA)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            {totalRevenueFCFA.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Liste des Membres & Statistiques d’utilisation
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b">
              <tr>
                <th className="text-left p-3.5">Membre / Établissement</th>
                <th className="text-left p-3.5">Charte</th>
                <th className="text-center p-3.5">Projets</th>
                <th className="text-right p-3.5">Chambres rés.</th>
                <th className="text-right p-3.5">Articles vendus</th>
                <th className="text-right p-3.5">CA suivi</th>
                <th className="text-right p-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => {
                const mEvents = telemetry.filter((t) => t.memberId === m.id);
                const rooms = mEvents.reduce((s, e) => s + e.roomsDelta, 0);
                const items = mEvents.reduce((s, e) => s + e.itemsDelta, 0);
                const rev = mEvents.reduce((s, e) => s + e.revenueDelta, 0);
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-slate-500">{m.email} • {m.organization}</div>
                    </td>
                    <td className="p-3.5">
                      {m.charterAccepted ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Acceptée
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">Non</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-semibold">{m.projects.length}</td>
                    <td className="p-3.5 text-right tabular-nums font-semibold">{rooms}</td>
                    <td className="p-3.5 text-right tabular-nums font-semibold">{items}</td>
                    <td className="p-3.5 text-right tabular-nums font-bold text-indigo-700">
                      {rev.toLocaleString('fr-FR')}
                    </td>
                    <td className="p-3.5 text-right">
                      {m.role !== 'admin' && (
                        <button
                          onClick={() => onToggleMemberStatus(m.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                            m.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <Ban className="w-3 h-3" />
                          {m.status === 'active' ? 'Suspendre' : 'Réactiver'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Telemetry Feed & Optional Cloud Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Journal d’activité en direct des membres
          </h3>
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
            {telemetry.slice(0, 20).map((ev) => (
              <div key={ev.id} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900">{ev.memberName}</span>
                  <div className="text-slate-500">{ev.detail} ({ev.projectName})</div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{ev.timestamp.slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            Connecteur Base de Données Cloud (Optionnel — Supabase Free Tier)
          </h3>
          <p className="text-slate-600 leading-relaxed">
            Sur GitHub Pages, les données sont sauvegardées localement par navigateur. Pour centraliser en temps réel les inscriptions et statistiques de vrais hôteliers dans le monde, renseignez un projet gratuit <strong>Supabase</strong> :
          </p>
          <input
            placeholder="Supabase Project URL (ex: https://xxx.supabase.co)"
            value={cloudCfg.supabaseUrl}
            onChange={(e) => setCloudCfg({ ...cloudCfg, supabaseUrl: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            placeholder="Supabase Anon Public Key"
            value={cloudCfg.supabaseAnonKey}
            onChange={(e) => setCloudCfg({ ...cloudCfg, supabaseAnonKey: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={cloudCfg.enabled}
                onChange={(e) => setCloudCfg({ ...cloudCfg, enabled: e.target.checked })}
              />
              Activer la synchronisation Cloud
            </label>
            <button
              type="button"
              onClick={() => {
                saveCloudConfig(cloudCfg);
                setCloudSaved(true);
                setTimeout(() => setCloudSaved(false), 2000);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
            >
              {cloudSaved ? 'Enregistré ✓' : 'Sauvegarder config Cloud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
