import React, { useState } from 'react';
import { Sliders, FolderKanban, Plus, Copy, Download, Upload, RotateCcw, Check } from 'lucide-react';
import type { CurrencyCode, HotelConfig, HotelProject, Language, PaymentMethod } from '../types/pms';
import { downloadJSON } from '../lib/format';

interface ConfiguratorProjectsViewProps {
  mode: 'configurator' | 'projects';
  project: HotelProject;
  projects: HotelProject[];
  lang: Language;
  onUpdateConfig: (newConfig: HotelConfig) => void;
  onSwitchProject: (projectId: string) => void;
  onCreateProject: (name: string, rooms: number, currency: CurrencyCode) => void;
  onDuplicateProject: (projectId: string) => void;
  onImportProject: (proj: HotelProject) => void;
  onResetCurrentProject: () => void;
}

export const ConfiguratorProjectsView: React.FC<ConfiguratorProjectsViewProps> = ({
  mode,
  project,
  projects,
  lang,
  onUpdateConfig,
  onSwitchProject,
  onCreateProject,
  onDuplicateProject,
  onImportProject,
  onResetCurrentProject,
}) => {
  const [cfg, setCfg] = useState<HotelConfig>(project.config);
  const [savedToast, setSavedToast] = useState(false);

  // New project form
  const [newName, setNewName] = useState('');
  const [newRooms, setNewRooms] = useState(10);
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>('FCFA');

  if (mode === 'projects') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              {lang === 'fr' ? 'Mémoire des Projets & Paramètres du Membre' : 'Member Projects & Saved Settings'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tous vos hôtels, scénarios et configurations modulaires sont sauvegardés automatiquement dans votre espace.
            </p>
          </div>
          <div className="flex gap-2">
            <label className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Importer JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  file.text().then((txt) => {
                    try {
                      const parsed = JSON.parse(txt) as HotelProject;
                      if (parsed && parsed.config && parsed.rooms) onImportProject(parsed);
                    } catch {
                      // ignore invalid json
                    }
                  });
                }}
              />
            </label>
            <button
              onClick={onResetCurrentProject}
              className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser projet actif
            </button>
          </div>
        </div>

        {/* Create new project */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            onCreateProject(newName.trim(), newRooms, newCurrency);
            setNewName('');
          }}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du nouvel hôtel / projet</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Résidence Océan — Grand-Popo"
              className="w-full px-3 py-2 border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chambres</label>
            <input
              type="number"
              min={2}
              max={100}
              value={newRooms}
              onChange={(e) => setNewRooms(Number(e.target.value))}
              className="w-24 px-3 py-2 border rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Devise</label>
            <select value={newCurrency} onChange={(e) => setNewCurrency(e.target.value as CurrencyCode)} className="px-3 py-2 border rounded-lg text-xs bg-white">
              <option value="FCFA">FCFA</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Créer & Sauvegarder
          </button>
        </form>

        {/* Saved Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const isActive = p.id === project.id;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-xl border transition ${
                  isActive ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.config.totalRooms} chambres • {p.config.currency} • {p.reservations.length} réservations
                    </p>
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold">ACTIF</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {!isActive && (
                    <button
                      onClick={() => onSwitchProject(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                    >
                      Charger ce projet
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicateProject(p.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Dupliquer
                  </button>
                  <button
                    onClick={() => downloadJSON(`openpms-${p.id}.json`, p)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Exporter JSON
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Modular Hotel & Billing Configurator
  const togglePayment = (method: PaymentMethod) => {
    const exists = cfg.billing.acceptedPayments.includes(method);
    const next = exists
      ? cfg.billing.acceptedPayments.filter((m) => m !== method)
      : [...cfg.billing.acceptedPayments, method];
    setCfg({ ...cfg, billing: { ...cfg.billing, acceptedPayments: next } });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(cfg);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            {lang === 'fr' ? 'Paramétrage Modulaire de l’Établissement & Facturation' : 'Modular Hotel & Billing Setup'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Activez ou désactivez les services selon votre hôtel réel ou votre scénario de cours.
          </p>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          {savedToast ? <Check className="w-4 h-4" /> : null}
          {savedToast ? 'Paramètres sauvegardés !' : 'Enregistrer les paramètres'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identité & Capacité */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">1. Établissement & Capacité</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-600">Nom de l’hôtel</label>
              <input value={cfg.hotelName} onChange={(e) => setCfg({ ...cfg, hotelName: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Devise</label>
              <select value={cfg.currency} onChange={(e) => setCfg({ ...cfg, currency: e.target.value as CurrencyCode })} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-600">Nombre de chambres</label>
              <input type="number" min={1} max={100} value={cfg.totalRooms} onChange={(e) => setCfg({ ...cfg, totalRooms: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Nombre d’étages</label>
              <input type="number" min={1} max={20} value={cfg.floors} onChange={(e) => setCfg({ ...cfg, floors: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
          </div>
        </div>

        {/* Modules Services */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">2. Modules Services à la carte</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: 'roomService', label: 'Service de chambre (Room Service)' },
              { key: 'barAndFood', label: 'Bar & Restauration à portée' },
              { key: 'minibar', label: 'Minibar en chambre' },
              { key: 'spa', label: 'Spa & Bien-être' },
              { key: 'parking', label: 'Parking payant' },
              { key: 'inventory', label: 'Gestion des stocks' },
            ].map((m) => (
              <label key={m.key} className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(cfg.modules[m.key as keyof typeof cfg.modules])}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      modules: { ...cfg.modules, [m.key]: e.target.checked },
                    })
                  }
                />
                <span className="font-medium text-slate-800">{m.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="font-semibold text-slate-600 block mb-1">Politique de Ménage / Gouvernante</label>
            <select
              value={cfg.modules.housekeepingMode}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  modules: {
                    ...cfg.modules,
                    housekeepingMode: e.target.value as HotelConfig['modules']['housekeepingMode'],
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
            >
              <option value="optional_guest_choice">Ménage au choix du client (Optionnel / Éco)</option>
              <option value="included">Ménage quotidien inclus automatiquement</option>
              <option value="disabled">Module ménage désactivé</option>
            </select>
          </div>
        </div>

        {/* Modularisation Facturation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs lg:col-span-2">
          <h3 className="font-bold text-slate-900 text-sm">3. Modularisation de la Facturation & Taxes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-600">TVA (%)</label>
              <input type="number" value={cfg.billing.vatRate} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, vatRate: Number(e.target.value) } })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Taxe de séjour / nuit ({cfg.currency})</label>
              <input type="number" value={cfg.billing.cityTaxPerNight} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, cityTaxPerNight: Number(e.target.value) } })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Frais de service (%)</label>
              <input type="number" value={cfg.billing.serviceChargeRate} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, serviceChargeRate: Number(e.target.value) } })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={cfg.billing.allowSplitBilling} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, allowSplitBilling: e.target.checked } })} />
              Facturation scindée (Entreprise / Client)
            </label>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={cfg.billing.allowGroupBilling} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, allowGroupBilling: e.target.checked } })} />
              Factures de groupe
            </label>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={cfg.billing.allowDiscountsAndCredits} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, allowDiscountsAndCredits: e.target.checked } })} />
              Avoirs & remises commerciales
            </label>
          </div>

          <div className="pt-2">
            <span className="font-semibold text-slate-600 block mb-1.5">Moyens de paiement acceptés :</span>
            <div className="flex flex-wrap gap-2">
              {(['cash', 'card', 'mobile_money', 'transfer', 'voucher', 'room_charge'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => togglePayment(m)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                    cfg.billing.acceptedPayments.includes(m)
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
