import React, { useMemo, useState } from 'react';
import { BarChart2, Download, Calendar, TrendingUp, ShoppingBag, BedDouble } from 'lucide-react';
import type { HotelProject, Language } from '../types/pms';
import { computeProjectsAnalytics, type TimeGranularity } from '../lib/analytics';
import { downloadCSV, formatMoney } from '../lib/format';
import { OccupancyLineChart, SimpleBarChart } from './AnalyticsCharts';

interface MemberStatsViewProps {
  activeProject: HotelProject;
  allProjects: HotelProject[];
  lang: Language;
}

export const MemberStatsView: React.FC<MemberStatsViewProps> = ({
  activeProject,
  allProjects,
  lang,
}) => {
  const [granularity, setGranularity] = useState<TimeGranularity>('day');
  const [scope, setScope] = useState<'active' | 'all'>('active');

  const targetProjects = scope === 'active' ? [activeProject] : allProjects;
  const currency = activeProject.config.currency;

  const analytics = useMemo(
    () => computeProjectsAnalytics(targetProjects, granularity),
    [targetProjects, granularity]
  );

  const granLabels: { id: TimeGranularity; fr: string; en: string }[] = [
    { id: 'day', fr: 'Par Jour (Date)', en: 'By Day' },
    { id: 'week', fr: 'Par Semaine', en: 'By Week' },
    { id: 'month', fr: 'Par Mois', en: 'By Month' },
    { id: 'year', fr: 'Par Année', en: 'By Year' },
    { id: 'total', fr: 'Au Total', en: 'Total' },
  ];

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['Période', 'Réservations', 'Nuitées occupées', 'Capacité', 'Taux remplissage (%)', 'CA Hébergement', 'CA Ventes/Extras', 'CA Total', 'Articles vendus'],
    ];
    analytics.series.forEach((p) => {
      rows.push([
        p.key,
        p.reservationsCount,
        p.occupiedRoomNights,
        p.capacityRoomNights,
        p.occupancyRate,
        p.roomRevenue,
        p.extrasRevenue,
        p.totalRevenue,
        p.itemsSold,
      ]);
    });
    downloadCSV(`openpms-mes-statistiques-${granularity}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            {lang === 'fr' ? 'Mes Statistiques — Réservations, Ventes & Remplissage' : 'My Statistics — Bookings, Sales & Occupancy'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'fr'
              ? 'Visualisez vos performances par jour, semaine, mois, année ou au total.'
              : 'Visualize your performance by day, week, month, year, or total.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as 'active' | 'all')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="active">Projet actif ({activeProject.config.hotelName})</option>
            <option value="all">Tous mes projets ({allProjects.length})</option>
          </select>

          <div className="flex bg-slate-100 p-1 rounded-lg text-xs">
            {granLabels.map((g) => (
              <button
                key={g.id}
                onClick={() => setGranularity(g.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  granularity === g.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'fr' ? g.fr : g.en}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* 4 Totals KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Réservations (période)</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {analytics.totals.reservationsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics.totals.occupiedRoomNights} nuitées occupées
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Taux de remplissage moyen</span>
            <BedDouble className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1.5 tabular-nums">
            {analytics.totals.occupancyRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Capacité : {analytics.totals.capacityRoomNights} chambres-nuits
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Ventes & Chiffre d’affaires</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {formatMoney(analytics.totals.totalRevenue, currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dont Extras/Bar/RS : {formatMoney(analytics.totals.extrasRevenue, currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Articles vendus (POS)</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1.5 tabular-nums">
            {analytics.totals.itemsSold}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Bar, Room Service & Minibar
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          title={lang === 'fr' ? 'Nombre de réservations' : 'Bookings Count'}
          subtitle="Arrivées enregistrées par période"
          color="#4F46E5"
          data={analytics.series.map((p) => ({
            label: p.label,
            value: p.reservationsCount,
            tooltip: `${p.reservationsCount} rés.`,
          }))}
        />

        <OccupancyLineChart
          title={lang === 'fr' ? 'Taux de remplissage de l’hôtel (%)' : 'Hotel Occupancy Rate (%)'}
          subtitle="Nuitées occupées / capacité disponible"
          data={analytics.series.map((p) => ({
            label: p.label,
            rate: p.occupancyRate,
            detail: `${p.occupiedRoomNights}/${p.capacityRoomNights}`,
          }))}
        />

        <SimpleBarChart
          title={lang === 'fr' ? 'Ventes & Chiffre d’affaires' : 'Sales & Revenue'}
          subtitle={`En ${currency} — Hébergement vs Bar/Room Service/Extras`}
          color="#2563EB"
          secondaryColor="#F59E0B"
          primaryLabel="Hébergement"
          secondaryLabel="Ventes / Extras"
          data={analytics.series.map((p) => ({
            label: p.label,
            value: p.roomRevenue,
            secondaryValue: p.extrasRevenue,
            tooltip: formatMoney(p.totalRevenue, currency),
          }))}
        />

        <SimpleBarChart
          title={lang === 'fr' ? 'Réservations par Canal de vente' : 'Bookings by Sales Channel'}
          subtitle="Direct, OTA, Entreprise, Téléphone, Agence"
          color="#0D9488"
          data={analytics.byChannel.map((c) => ({
            label: c.label,
            value: c.count,
            tooltip: `${c.count} rés. (${formatMoney(c.revenue, currency)})`,
          }))}
        />
      </div>

      {/* Period Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b font-bold text-sm text-slate-900">
          Détail chiffré par période ({granLabels.find((g) => g.id === granularity)?.fr})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b">
              <tr>
                <th className="text-left p-3">Période</th>
                <th className="text-right p-3">Réservations</th>
                <th className="text-right p-3">Nuitées</th>
                <th className="text-right p-3">Taux remplissage</th>
                <th className="text-right p-3">CA Hébergement</th>
                <th className="text-right p-3">CA Ventes/Extras</th>
                <th className="text-right p-3">CA Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.series.map((p) => (
                <tr key={p.key} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{p.key}</td>
                  <td className="p-3 text-right tabular-nums">{p.reservationsCount}</td>
                  <td className="p-3 text-right tabular-nums">{p.occupiedRoomNights} / {p.capacityRoomNights}</td>
                  <td className="p-3 text-right font-semibold text-emerald-700 tabular-nums">{p.occupancyRate}%</td>
                  <td className="p-3 text-right tabular-nums">{formatMoney(p.roomRevenue, currency)}</td>
                  <td className="p-3 text-right tabular-nums text-amber-700">{formatMoney(p.extrasRevenue, currency)}</td>
                  <td className="p-3 text-right font-bold text-indigo-700 tabular-nums">{formatMoney(p.totalRevenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
