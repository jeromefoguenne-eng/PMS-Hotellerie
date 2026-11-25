import React, { useMemo, useState } from 'react';
import { ShieldAlert, Users, Activity, Download, Database, CheckCircle2, Ban } from 'lucide-react';
import type { Language, MemberAccount, TelemetryEvent } from '../types/pms';
import { downloadCSV, downloadJSON } from '../lib/format';
import { loadCloudConfig, saveCloudConfig } from '../lib/storage';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSync';
import { computeAdminAnalytics, type TimeGranularity } from '../lib/analytics';
import { OccupancyLineChart, SimpleBarChart } from './AnalyticsCharts';

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
  const [granularity, setGranularity] = useState<TimeGranularity>('day');
  const [filterMemberId, setFilterMemberId] = useState<string>('ALL');

  const analytics = useMemo(
    () => computeAdminAnalytics(members, telemetry, granularity, filterMemberId),
    [members, telemetry, granularity, filterMemberId]
  );

  const totalRoomsBooked = analytics.totals.reservationsCount;
  const totalItemsSold = analytics.totals.itemsSold;
  const totalRevenueAll = analytics.totals.totalRevenue;

  const memberComparisonData = useMemo(() => {
    return members.map((m) => {
      const mRes = m.projects.reduce(
        (s, p) => s + p.reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'no_show').length,
        0
      );
      return {
        label: m.name.split(' ')[0],
        value: mRes,
        tooltip: `${m.name}: ${mRes} rés.`,
      };
    });
  }, [members]);

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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            {lang === 'fr' ? 'Espace Administrateur — Statistiques Globales & Membres' : 'Admin Space — Global Analytics & Members'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisez les réservations par date, le taux de remplissage par jour/mois/an, le CA et l’usage par membre.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterMemberId}
            onChange={(e) => setFilterMemberId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Tous les membres ({members.length})</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <div className="flex bg-slate-100 p-1 rounded-lg text-xs">
            {(
              [
                { id: 'day', label: 'Jour' },
                { id: 'week', label: 'Semaine' },
                { id: 'month', label: 'Mois' },
                { id: 'year', label: 'An' },
                { id: 'total', label: 'Total' },
              ] as { id: TimeGranularity; label: string }[]
            ).map((g) => (
              <button
                key={g.id}
                onClick={() => setGranularity(g.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  granularity === g.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportStatsCSV}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => downloadJSON('openpms-telemetry.json', telemetry)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            JSON
          </button>
        </div>
      </div>

      {/* Global Aggregated KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Membres inscrits</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{members.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {members.reduce((s, m) => s + m.projects.length, 0)} projets hôteliers actifs
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Réservations (sélection)</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1 tabular-nums">{totalRoomsBooked}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Remplissage moyen : {analytics.totals.occupancyRate}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">Éléments vendus (Bar/RS)</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{totalItemsSold}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Consommations extras suivies</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold">CA Cumulé (Tous projets)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
            {totalRevenueAll.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Hébergement + Extras</div>
        </div>
      </div>

      {/* Visual Charts directly in Admin Space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          title="Nombre de réservations par date / période"
          subtitle="Activité de réservation consolidée"
          color="#4F46E5"
          data={analytics.series.map((p) => ({
            label: p.label,
            value: p.reservationsCount,
            tooltip: `${p.reservationsCount} rés.`,
          }))}
        />

        <OccupancyLineChart
          title="Taux de remplissage des hôtels (%)"
          subtitle="Évolution par jour, semaine, mois ou année"
          data={analytics.series.map((p) => ({
            label: p.label,
            rate: p.occupancyRate,
            detail: `${p.occupiedRoomNights}/${p.capacityRoomNights}`,
          }))}
        />

        <SimpleBarChart
          title="Chiffre d’affaires généré par période"
          subtitle="Hébergement vs Extras / Bar / Room Service"
          color="#2563EB"
          secondaryColor="#F59E0B"
          primaryLabel="Hébergement"
          secondaryLabel="Extras"
          data={analytics.series.map((p) => ({
            label: p.label,
            value: p.roomRevenue,
            secondaryValue: p.extrasRevenue,
            tooltip: p.totalRevenue.toLocaleString('fr-FR'),
          }))}
        />

        <SimpleBarChart
          title="Comparatif des réservations par Membre"
          subtitle="Volume de réservations par compte inscrit"
          color="#0D9488"
          data={memberComparisonData}
        />
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
            Sur GitHub Pages, les données sont sauvegardées localement par navigateur. Pour synchroniser en temps réel vos hôtels entre PC, smartphones, tablettes et employés, renseignez un projet gratuit <strong>Supabase</strong> :
          </p>
          <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 text-[10px] overflow-x-auto">{SUPABASE_SQL_SCHEMA}</pre>
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
