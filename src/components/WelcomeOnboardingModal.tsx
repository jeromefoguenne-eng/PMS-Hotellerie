import React, { useState } from 'react';
import {
  Sparkles,
  FolderKanban,
  CalendarRange,
  Users,
  BarChart2,
  GraduationCap,
  CheckCircle2,
  X,
} from 'lucide-react';
import { OpenHotelPmsLogo } from './OpenHotelPmsLogo';

interface WelcomeOnboardingModalProps {
  memberName: string;
  onClose: () => void;
  onGoToProjects: () => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  memberName,
  onClose,
  onGoToProjects,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OpenHotelPmsLogo size="sm" />
            <div>
              <h2 className="font-bold text-base">Bienvenue sur OpenHotelPMS, {memberName} !</h2>
              <p className="text-xs text-slate-300">Guide rapide de prise en main (première connexion)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700">
          {step === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                <div className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                  1. Créer & Paramétrer vos Hôtels
                </div>
                <p className="leading-relaxed text-slate-600">
                  Dans <strong>Mes Projets</strong> et <strong>Marketplace / Modules</strong>, créez autant d’hôtels que vous voulez : devise, nombre de chambres, lits, équipements, carte Bar/Room Service, formules (Petit-déj, Spa) et taxes. Tout est sauvegardé automatiquement.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-emerald-600" />
                  2. Piloter au quotidien (Style Mews)
                </div>
                <p className="leading-relaxed text-slate-600">
                  Utilisez la <strong>Timeline</strong> (glisser-déposer des réservations), le <strong>CRM Clients</strong> (préférences, plaintes), la <strong>Facturation scindée & PDF</strong>, le module <strong>Gouvernante</strong> et le <strong>POS / Stocks</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  3. Partager avec vos Employés
                </div>
                <p className="leading-relaxed text-slate-600">
                  Dans <strong>Historique Actions & Équipe</strong>, invitez vos collaborateurs (réception, ménage, comptabilité), choisissez précisément les fonctionnalités autorisées et suivez chaque action posée.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  4. Statistiques & Formation (1–6)
                </div>
                <p className="leading-relaxed text-slate-600">
                  Consultez vos graphiques dans <strong>Mes Statistiques</strong> (par jour, semaine, mois, an, total) ou entraînez-vous sur les <strong>20 scénarios pédagogiques</strong> dans <strong>Parcours Pédagogique</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Raccourcis utiles pour démarrer
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                  <li><strong>Ctrl + K</strong> : recherche rapide instantanée de n’importe quel client ou réservation.</li>
                  <li><strong>Sélecteur d’hôtel en haut à gauche</strong> : basculez d’un projet à un autre en 1 clic.</li>
                  <li><strong>Bouton +1J (Night Audit)</strong> : avancez l’horloge simulée pour tester les arrivées/départs et clôtures.</li>
                  <li><strong>Bouton Aide (?)</strong> dans la barre supérieure : rouvrez ce guide à tout moment.</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Votre espace est prêt et sauvegardé automatiquement.</span>
            </div>
            <div className="flex gap-2">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  Raccourcis utiles →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold"
                >
                  ← Retour
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToProjects();
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Créer mon 1er hôtel
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Commencer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
