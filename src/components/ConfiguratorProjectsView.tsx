import React, { useEffect, useState } from 'react';
import { Sliders, FolderKanban, Plus, Copy, Download, Upload, RotateCcw, Check, Sparkles } from 'lucide-react';
import type { CurrencyCode, HotelConfig, HotelProject, Language, PaymentMethod } from '../types/pms';
import { downloadJSON } from '../lib/format';

interface ConfiguratorProjectsViewProps {
  mode: 'configurator' | 'projects';
  project: HotelProject;
  projects: HotelProject[];
  lang: Language;
  onUpdateConfig: (newConfig: HotelConfig) => void;
  onSwitchProject: (projectId: string) => void;
  onCreateConfiguredProject: (config: HotelConfig) => void;
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
  onCreateConfiguredProject,
  onDuplicateProject,
  onImportProject,
  onResetCurrentProject,
}) => {
  const [cfg, setCfg] = useState<HotelConfig>(project.config);
  const [savedToast, setSavedToast] = useState(false);

  // Pre-launch Wizard modal for creating a new project
  const [showWizard, setShowWizard] = useState(false);
  const [wizStep, setWizStep] = useState<1 | 2 | 3>(1);
  const [wizName, setWizName] = useState('');
  const [wizCity, setWizCity] = useState('Cotonou');
  const [wizCountry, setWizCountry] = useState('Bénin');
  const [wizCurrency, setWizCurrency] = useState<CurrencyCode>('FCFA');
  const [wizRooms, setWizRooms] = useState(12);
  const [wizFloors, setWizFloors] = useState(2);
  const [wizStars, setWizStars] = useState(3);
  const [wizRoomService, setWizRoomService] = useState(true);
  const [wizBar, setWizBar] = useState(true);
  const [wizMinibar, setWizMinibar] = useState(true);
  const [wizHousekeeping, setWizHousekeeping] = useState<HotelConfig['modules']['housekeepingMode']>('optional_guest_choice');
  const [wizBreakfast, setWizBreakfast] = useState(true);
  const [wizSpa, setWizSpa] = useState(false);
  const [wizParking, setWizParking] = useState(true);
  const [wizVat, setWizVat] = useState(18);
  const [wizCityTax, setWizCityTax] = useState(1500);
  const [wizSplit, setWizSplit] = useState(true);
  const [wizCancel, setWizCancel] = useState<HotelConfig['billing']['cancellationPolicy']>('24h');

  useEffect(() => {
    setCfg(project.config);
  }, [project.id, project.config]);

  const handleLaunchWizardProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizName.trim()) return;
    const fullConfig: HotelConfig = {
      ...project.config,
      hotelName: wizName.trim(),
      city: wizCity.trim() || 'Cotonou',
      country: wizCountry.trim() || 'Bénin',
      currency: wizCurrency,
      totalRooms: wizRooms,
      floors: wizFloors,
      categoryStars: wizStars,
      modules: {
        ...project.config.modules,
        roomService: wizRoomService,
        barAndFood: wizBar,
        minibar: wizMinibar,
        housekeepingMode: wizHousekeeping,
        breakfastIncluded: wizBreakfast,
        spa: wizSpa,
        parking: wizParking,
        inventory: true,
        onlineCheckIn: true,
      },
      billing: {
        ...project.config.billing,
        vatRate: wizVat,
        cityTaxPerNight: wizCityTax,
        allowSplitBilling: wizSplit,
        cancellationPolicy: wizCancel,
      },
    };
    onCreateConfiguredProject(fullConfig);
    setShowWizard(false);
    setWizStep(1);
    setWizName('');
  };

  if (mode === 'projects') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
              {lang === 'fr' ? 'Mes Hôtels & Projets Sauvegardés' : 'My Saved Hotels & Projects'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chaque projet conserve automatiquement sa configuration complète, ses chambres, ses réservations et son historique d’actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWizard(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Créer & Paramétrer un Nouvel Hôtel
            </button>
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
                      // ignore
                    }
                  });
                }}
              />
            </label>
            <button
              onClick={onResetCurrentProject}
              className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser actif
            </button>
          </div>
        </div>

        {/* Saved Projects Grid */}
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
                      {p.config.totalRooms} ch. • {p.config.currency} • {p.reservations.length} réservations •{' '}
                      {p.config.modules.roomService ? 'Room Service ✓' : 'Sans RS'} •{' '}
                      {p.config.modules.barAndFood ? 'Bar ✓' : 'Sans Bar'}
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
                      Ouvrir cet hôtel
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicateProject(p.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Dupliquer
                  </button>
                  <button
                    onClick={() => downloadJSON(`open-hotel-pms-${p.id}.json`, p)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Exporter JSON
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pre-Launch Project Configuration Wizard Modal */}
        {showWizard && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleLaunchWizardProject} className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Assistant de Paramétrage — Nouvel Hôtel (Étape {wizStep}/3)
                  </h3>
                  <p className="text-xs text-slate-500">Configurez votre établissement avant de le lancer.</p>
                </div>
              </div>

              {wizStep === 1 && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Nom de l’hôtel / projet *</label>
                    <input required value={wizName} onChange={(e) => setWizName(e.target.value)} placeholder="Ex: Hôtel Azalai — Cotonou" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Ville</label>
                      <input value={wizCity} onChange={(e) => setWizCity(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Pays</label>
                      <input value={wizCountry} onChange={(e) => setWizCountry(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">Devise</label>
                      <select value={wizCurrency} onChange={(e) => setWizCurrency(e.target.value as CurrencyCode)} className="w-full mt-1 px-2 py-2 border rounded-lg bg-white">
                        <option value="FCFA">FCFA</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CHF">CHF</option>
                        <option value="MAD">MAD</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Chambres</label>
                      <input type="number" min={1} max={100} value={wizRooms} onChange={(e) => setWizRooms(Number(e.target.value))} className="w-full mt-1 px-2 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Étages</label>
                      <input type="number" min={1} max={20} value={wizFloors} onChange={(e) => setWizFloors(Number(e.target.value))} className="w-full mt-1 px-2 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Étoiles</label>
                      <select value={wizStars} onChange={(e) => setWizStars(Number(e.target.value))} className="w-full mt-1 px-2 py-2 border rounded-lg bg-white">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <option key={s} value={s}>{s} ★</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {wizStep === 2 && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={wizRoomService} onChange={(e) => setWizRoomService(e.target.checked)} />
                      <span>Service en chambre (Room Service)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={wizBar} onChange={(e) => setWizBar(e.target.checked)} />
                      <span>Bar & Restauration</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={wizMinibar} onChange={(e) => setWizMinibar(e.target.checked)} />
                      <span>Minibar en chambre</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={wizBreakfast} onChange={(e) => setWizBreakfast(e.target.checked)} />
                      <span>Petit-déjeuner inclus</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={wizSpa} onChange={(e) => setWizSpa(e.target.checked)} />
                      <span>Spa & Bien-être</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={wizParking} onChange={(e) => setWizParking(e.target.checked)} />
                      <span>Parking</span>
                    </label>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Politique de Ménage</label>
                    <select value={wizHousekeeping} onChange={(e) => setWizHousekeeping(e.target.value as HotelConfig['modules']['housekeepingMode'])} className="w-full px-3 py-2 border rounded-lg bg-white">
                      <option value="optional_guest_choice">Au choix du client (Optionnel)</option>
                      <option value="included">Inclus automatiquement</option>
                      <option value="disabled">Désactivé</option>
                    </select>
                  </div>
                </div>
              )}

              {wizStep === 3 && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700">TVA (%)</label>
                      <input type="number" value={wizVat} onChange={(e) => setWizVat(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700">Taxe de séjour / nuit ({wizCurrency})</label>
                      <input type="number" value={wizCityTax} onChange={(e) => setWizCityTax(Number(e.target.value))} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Politique d’annulation</label>
                    <select value={wizCancel} onChange={(e) => setWizCancel(e.target.value as HotelConfig['billing']['cancellationPolicy'])} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
                      <option value="flexible">Flexible (gratuite jusqu’au jour J)</option>
                      <option value="24h">24h avant l’arrivée</option>
                      <option value="non_refundable">Non remboursable</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={wizSplit} onChange={(e) => setWizSplit(e.target.checked)} />
                    <span>Activer la facturation scindée (Entreprise / Client)</span>
                  </label>
                </div>
              )}

              <div className="flex justify-between pt-3 border-t">
                <button type="button" onClick={() => setShowWizard(false)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">
                  Annuler
                </button>
                <div className="flex gap-2">
                  {wizStep > 1 && (
                    <button type="button" onClick={() => setWizStep((wizStep - 1) as 1 | 2)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">
                      ← Précédent
                    </button>
                  )}
                  {wizStep < 3 ? (
                    <button type="button" onClick={() => setWizStep((wizStep + 1) as 2 | 3)} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                      Suivant →
                    </button>
                  ) : (
                    <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                      Lancer cet Hôtel ✓
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
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
            {lang === 'fr' ? 'Paramétrage Modulaire (Marketplace & Facturation)' : 'Modular Hotel & Billing Setup'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chaque modification est automatiquement mémorisée pour cet hôtel.
          </p>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
        >
          {savedToast ? <Check className="w-4 h-4" /> : null}
          {savedToast ? 'Sauvegardé !' : 'Enregistrer les paramètres'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF</option>
                <option value="MAD">MAD</option>
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

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">2. Modules Services à la carte</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { key: 'roomService', label: 'Service de chambre (Room Service)' },
              { key: 'barAndFood', label: 'Bar & Restauration à portée' },
              { key: 'minibar', label: 'Minibar en chambre' },
              { key: 'breakfastIncluded', label: 'Petit-déjeuner inclus' },
              { key: 'onlineCheckIn', label: 'Check-in en ligne (style Mews)' },
              { key: 'spa', label: 'Spa & Bien-être' },
              { key: 'parking', label: 'Parking payant' },
              { key: 'inventory', label: 'Gestion des stocks' },
            ].map((m) => (
              <label key={m.key} className="flex items-center gap-2 p-2 rounded-lg border bg-slate-50 cursor-pointer">
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

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs lg:col-span-2">
          <h3 className="font-bold text-slate-900 text-sm">3. Modularisation de la Facturation & Taxes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-slate-600">TVA (%)</label>
              <input type="number" value={cfg.billing.vatRate} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, vatRate: Number(e.target.value) } })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Taxe séjour / nuit ({cfg.currency})</label>
              <input type="number" value={cfg.billing.cityTaxPerNight} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, cityTaxPerNight: Number(e.target.value) } })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Frais de service (%)</label>
              <input type="number" value={cfg.billing.serviceChargeRate} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, serviceChargeRate: Number(e.target.value) } })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="font-semibold text-slate-600">Annulation</label>
              <select value={cfg.billing.cancellationPolicy || '24h'} onChange={(e) => setCfg({ ...cfg, billing: { ...cfg.billing, cancellationPolicy: e.target.value as HotelConfig['billing']['cancellationPolicy'] } })} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
                <option value="flexible">Flexible</option>
                <option value="24h">24h avant</option>
                <option value="non_refundable">Non remboursable</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
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
