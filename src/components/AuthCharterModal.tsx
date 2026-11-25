import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, LogIn, CheckCircle2, Lock } from 'lucide-react';
import type { Language, MemberAccount } from '../types/pms';
import { OpenHotelPmsLogo } from './OpenHotelPmsLogo';
import { hashPassword, validatePasswordStrength } from '../lib/security';

interface AuthCharterModalProps {
  lang: Language;
  members: MemberAccount[];
  onLogin: (member: MemberAccount) => void;
  onRegister: (data: {
    name: string;
    email: string;
    passwordHash: string;
    organization: string;
    role: 'member' | 'teacher';
  }) => void;
}

export const AuthCharterModal: React.FC<AuthCharterModalProps> = ({
  lang,
  members,
  onLogin,
  onRegister,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'member' | 'teacher'>('member');
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    const cleanEmail = email.trim().toLowerCase();
    const computedHash = await hashPassword(cleanEmail, password);
    const found = members.find(
      (m) => m.email.toLowerCase() === cleanEmail && m.passwordHash === computedHash
    );

    if (!found) {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      if (nextFails >= 5) {
        setLockoutSeconds(60);
        setFailedAttempts(0);
        setError('Trop de tentatives échouées. Connexion bloquée pendant 60 secondes.');
      } else {
        setError(
          lang === 'fr'
            ? `Identifiants incorrects (${5 - nextFails} essai(s) restant(s)).`
            : `Invalid credentials (${5 - nextFails} attempts left).`
        );
      }
      return;
    }

    if (found.status === 'suspended') {
      setError(lang === 'fr' ? 'Ce compte a été suspendu par l’administrateur.' : 'This account has been suspended.');
      return;
    }

    setFailedAttempts(0);
    onLogin(found);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !organization.trim()) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs.' : 'Please fill in all fields.');
      return;
    }
    const pwdError = validatePasswordStrength(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setError(lang === 'fr' ? 'Un compte existe déjà avec cet e-mail.' : 'An account with this email already exists.');
      return;
    }
    if (!charterAccepted) {
      setError(
        lang === 'fr'
          ? 'Vous devez accepter la Charte OpenHotelPMS et le partage de vos coordonnées et statistiques pour créer un compte gratuit.'
          : 'You must accept the OpenHotelPMS Charter and statistics sharing agreement.'
      );
      return;
    }
    const passwordHash = await hashPassword(cleanEmail, password);
    onRegister({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      organization: organization.trim(),
      role,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-5 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Left Brand Panel */}
        <div className="md:col-span-2 bg-slate-900 text-white p-8 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <OpenHotelPmsLogo size="lg" />
            </div>

            <h2 className="text-2xl font-bold leading-snug mb-4">
              {lang === 'fr'
                ? 'Le PMS Open Source modulaire, gratuit et pédagogique.'
                : 'The modular, free, open-source & educational PMS.'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {lang === 'fr'
                ? 'Inspiré de Mews Operations : gérez votre petit hôtel en ligne ou formez vos étudiants sur 6 niveaux complets, avec sauvegarde de tous vos projets.'
                : 'Inspired by Mews Operations: run your small hotel online or train hospitality students across 6 levels with full project memory.'}
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lang === 'fr' ? '100 % personnalisable (chambres, bar, ménage, facturation)' : '100% customizable (rooms, bar, housekeeping, billing)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lang === 'fr' ? 'Mémoire multi-projets & paramètres sauvegardés' : 'Multi-project memory & saved configurations'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{lang === 'fr' ? '20 scénarios pédagogiques & mode Examen' : '20 learning scenarios & Exam mode'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'fr'
                ? 'Accès sécurisé — Mots de passe hachés (SHA-256) & protection anti-brute-force.'
                : 'Secured access — Hashed passwords (SHA-256) & brute-force protection.'}
            </span>
          </div>
        </div>

        {/* Right Auth & Charter Panel */}
        <div className="md:col-span-3 p-8">
          <div className="flex gap-2 border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(''); }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                tab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              {lang === 'fr' ? 'Connexion Membre' : 'Member Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(''); }}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                tab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              {lang === 'fr' ? 'Créer un compte gratuit' : 'Free Registration'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'fr' ? 'Mot de passe' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={lockoutSeconds > 0}
                className="w-full py-2.5 rounded-lg bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm"
              >
                {lockoutSeconds > 0
                  ? `Patientez ${lockoutSeconds}s...`
                  : lang === 'fr'
                  ? 'Accéder à mon espace OpenHotelPMS'
                  : 'Enter OpenHotelPMS Workspace'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'fr' ? 'Nom complet' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Jean Houndjo"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'fr' ? 'Profil' : 'Profile'}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'member' | 'teacher')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="member">{lang === 'fr' ? 'Hôtelier / Étudiant' : 'Hotelier / Student'}</option>
                    <option value="teacher">{lang === 'fr' ? 'Enseignant / Formateur' : 'Teacher / Trainer'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@monhotel.bj"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'fr' ? 'Mot de passe (8+ car., Maj, Chiffre, Spécial)' : 'Password (strong)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: Hotel2026@"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'fr' ? 'Établissement / École / Hôtel' : 'Hotel / School Name'}
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Ex: Résidence Les Cocotiers — Ouidah"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Charte OpenHotelPMS obligatoire */}
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  {lang === 'fr'
                    ? 'Charte OpenHotelPMS — Statistiques & Contact Membre'
                    : 'OpenHotelPMS Charter — Statistics & Member Contact'}
                </div>
                <div className="max-h-28 overflow-y-auto pr-1 text-[11px] leading-relaxed text-slate-600 space-y-1">
                  <p>
                    <strong>1. Gratuité & Open Source :</strong> OpenHotelPMS est mis à disposition gratuitement pour la formation hôtelière et la gestion de petits établissements.
                  </p>
                  <p>
                    <strong>2. Partage des statistiques & E-mail :</strong> En créant un compte membre, vous acceptez de partager avec le propriétaire du site votre adresse e-mail (afin de pouvoir vous contacter) ainsi que vos statistiques d’utilisation (chambres réservées, chiffre d’affaires, articles vendus, taux d’occupation, modules activés).
                  </p>
                  <p>
                    <strong>3. Sauvegarde :</strong> Vos paramètres et projets restent sauvegardés dans votre espace personnel.
                  </p>
                </div>
                <label className="flex items-start gap-2 pt-1 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={charterAccepted}
                    onChange={(e) => setCharterAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    {lang === 'fr'
                      ? 'J’ai lu et j’accepte la Charte OpenHotelPMS, la collecte de mon e-mail de contact et le partage de mes statistiques.'
                      : 'I accept the OpenHotelPMS Charter, contact email collection, and statistics sharing.'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm"
              >
                {lang === 'fr' ? 'Créer mon espace OpenHotelPMS gratuit' : 'Create my free OpenHotelPMS account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
