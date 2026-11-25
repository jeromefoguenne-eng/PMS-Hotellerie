import React, { useState } from 'react';
import { GraduationCap, Award, CheckCircle2, Play, BarChart3, Download, HelpCircle } from 'lucide-react';
import type { HotelProject, Language, PedagogicalMode } from '../types/pms';
import { PEDAGOGICAL_SCENARIOS, PEDAGOGY_LEVELS, QUIZ_QUESTIONS } from '../data/pedagogyData';
import { downloadCSV, formatMoney } from '../lib/format';

interface PedagogyReportsViewProps {
  mode: 'pedagogy' | 'reports';
  project: HotelProject;
  lang: Language;
  onStartScenario: (scenarioId: string, targetTab: string) => void;
  onCompleteScenario: (scenarioId: string, points: number) => void;
  onSubmitQuiz: (level: number, score: number) => void;
  onChangeMode: (m: PedagogicalMode) => void;
  onNavigate: (tab: string) => void;
}

export const PedagogyReportsView: React.FC<PedagogyReportsViewProps> = ({
  mode,
  project,
  lang,
  onStartScenario,
  onCompleteScenario,
  onSubmitQuiz,
  onChangeMode,
  onNavigate,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(project.pedagogy.currentLevel || 1);
  const [quizAnswer, setQuizAnswer] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, boolean>>({});

  if (mode === 'reports') {
    const roomsTotal = project.rooms.filter((r) => r.status !== 'out_of_order').length || 1;
    const occupied = project.rooms.filter((r) => r.status === 'occupied').length;
    const occRate = Math.round((occupied / roomsTotal) * 100);
    const totalInvoiced = project.folios.reduce(
      (s, f) => s + f.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0),
      0
    );
    const roomRev = project.folios.reduce(
      (s, f) => s + f.items.filter((i) => i.category === 'room').reduce((a, i) => a + i.quantity * i.unitPrice, 0),
      0
    );
    const fnbRev = project.folios.reduce(
      (s, f) =>
        s +
        f.items
          .filter((i) => ['bar', 'room_service', 'minibar', 'restaurant'].includes(i.category))
          .reduce((a, i) => a + i.quantity * i.unitPrice, 0),
      0
    );

    const exportReportCSV = () => {
      downloadCSV(`openpms-rapport-${project.simulatedDate}.csv`, [
        ['Indicateur', 'Valeur'],
        ['Établissement', project.config.hotelName],
        ['Date simulée', project.simulatedDate],
        ['Taux occupation (%)', occRate],
        ['CA Hébergement', roomRev],
        ['CA Bar / Room Service / Minibar', fnbRev],
        ['CA Total Facturé', totalInvoiced],
      ]);
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              {lang === 'fr' ? 'Rapports & Pilotage (Revenue Management)' : 'Reports & Revenue Management'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Indicateurs USALI simplifiés : Occupation, ADR, RevPAR et répartition du chiffre d’affaires.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportReportCSV}
              className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold"
            >
              Imprimer / PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-semibold">CA Hébergement cumulé</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {formatMoney(roomRev, project.config.currency)}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-semibold">CA Bar / Room Service / Minibar</div>
            <div className="text-2xl font-bold text-indigo-700 mt-1 tabular-nums">
              {formatMoney(fnbRev, project.config.currency)}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-semibold">CA Total Facturé</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
              {formatMoney(totalInvoiced, project.config.currency)}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Plans Tarifaires & Revenue Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {project.config.ratePlans.map((rp) => (
              <div key={rp.id} className="p-3.5 rounded-xl bg-slate-50 border">
                <div className="font-bold text-slate-900">{rp.name}</div>
                <div className="text-indigo-700 font-bold text-base mt-1">×{rp.multiplier.toFixed(2)}</div>
                <div className="text-slate-500 mt-1">{rp.description}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('configurator')}
            className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Ajuster les tarifs et la saisonnalité dans Paramétrage →
          </button>
        </div>
      </div>
    );
  }

  // Pedagogy View (6 Levels + 20 Scenarios + Quiz)
  const levelInfo = PEDAGOGY_LEVELS.find((l) => l.level === selectedLevel) || PEDAGOGY_LEVELS[0];
  const scenarios = PEDAGOGICAL_SCENARIOS.filter((s) => s.level === selectedLevel);
  const questions = QUIZ_QUESTIONS.filter((q) => q.level === selectedLevel);

  return (
    <div className="space-y-6">
      {/* Header & Mode Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600" />
            {lang === 'fr' ? 'Parcours Pédagogique OpenPMS (Niveaux 1 à 6)' : 'OpenPMS Learning Path (Levels 1–6)'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Score actuel : <strong className="text-indigo-700">{project.pedagogy.score} pts</strong> •{' '}
            Scénarios réussis : <strong>{project.pedagogy.completedScenarios.length}/20</strong>
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          {(['learning', 'exercise', 'exam', 'live'] as PedagogicalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onChangeMode(m)}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                project.pedagogy.mode === m ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'learning' ? 'Apprentissage' : m === 'exercise' ? 'Exercice' : m === 'exam' ? 'Examen' : 'Hôtel Réel'}
            </button>
          ))}
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {PEDAGOGY_LEVELS.map((lvl) => (
          <button
            key={lvl.level}
            onClick={() => setSelectedLevel(lvl.level)}
            className={`p-3 rounded-xl border text-left transition ${
              selectedLevel === lvl.level
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="text-[10px] uppercase font-bold opacity-80">Niveau {lvl.level}</div>
            <div className="text-xs font-bold mt-0.5 truncate">
              {(lang === 'fr' ? lvl.titleFr : lvl.titleEn).replace(/^Niveau \d+ – |^Level \d+ – /, '')}
            </div>
          </button>
        ))}
      </div>

      {/* Level Objective & Tutorial */}
      {project.pedagogy.mode !== 'exam' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-1.5">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-600" />
            {lang === 'fr' ? levelInfo.titleFr : levelInfo.titleEn} — Objectif
          </div>
          <p className="text-amber-800">{lang === 'fr' ? levelInfo.objectiveFr : levelInfo.objectiveEn}</p>
          <p className="text-slate-700 pt-1">
            <strong>Tutoriel :</strong> {lang === 'fr' ? levelInfo.tutorialFr : levelInfo.tutorialEn}
          </p>
        </div>
      )}

      {/* Scenarios List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((sc) => {
          const done = project.pedagogy.completedScenarios.includes(sc.id);
          const isActive = project.pedagogy.activeScenarioId === sc.id;
          return (
            <div
              key={sc.id}
              className={`bg-white p-5 rounded-xl border shadow-xs flex flex-col justify-between ${
                isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-indigo-600">+{sc.points} pts</span>
                  {done && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Validé
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-1">
                  {lang === 'fr' ? sc.titleFr : sc.titleEn}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  {lang === 'fr' ? sc.descriptionFr : sc.descriptionEn}
                </p>
                {project.pedagogy.mode === 'learning' && (
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-500 list-disc list-inside">
                    {(lang === 'fr' ? sc.stepsFr : sc.stepsEn).map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onStartScenario(sc.id, sc.targetTab)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> Lancer l’exercice
                </button>
                {!done && (
                  <button
                    onClick={() => onCompleteScenario(sc.id, sc.points)}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold"
                  >
                    Valider l’étape ✓
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Level Quiz */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Quiz de validation — Niveau {selectedLevel}
        </h3>
        {questions.map((q) => {
          const chosen = quizAnswer[q.id];
          const checked = quizFeedback[q.id];
          const isCorrect = chosen === q.correctIndex;
          return (
            <div key={q.id} className="space-y-2 text-xs">
              <p className="font-semibold text-slate-900">{lang === 'fr' ? q.questionFr : q.questionEn}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(lang === 'fr' ? q.optionsFr : q.optionsEn).map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuizAnswer({ ...quizAnswer, [q.id]: idx });
                      setQuizFeedback({ ...quizFeedback, [q.id]: true });
                      if (idx === q.correctIndex) onSubmitQuiz(selectedLevel, 100);
                    }}
                    className={`p-2.5 rounded-lg border text-left font-medium transition ${
                      chosen === idx
                        ? idx === q.correctIndex
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-red-50 border-red-400 text-red-700'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {checked && (
                <p className={`text-[11px] font-medium ${isCorrect ? 'text-emerald-700' : 'text-red-600'}`}>
                  {isCorrect ? 'Bravo ! ' : 'À revoir : '}
                  {lang === 'fr' ? q.explanationFr : q.explanationEn}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
