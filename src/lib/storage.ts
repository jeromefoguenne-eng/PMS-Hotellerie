import type { Language, MemberAccount, SiteVisitEvent, TelemetryEvent } from '../types/pms';
import { createSeedMembers, createSeedTelemetry } from '../data/seedData';

const MEMBERS_KEY = 'openpms_members_v1';
const TELEMETRY_KEY = 'openpms_telemetry_v1';
const VISITS_KEY = 'openpms_visits_v1';
const CURRENT_USER_KEY = 'openpms_current_member_id_v1';
const CLOUD_CONFIG_KEY = 'openpms_cloud_config_v1';

export interface CloudConfig {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function loadCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { enabled: false, supabaseUrl: '', supabaseAnonKey: '' };
}

export function saveCloudConfig(cfg: CloudConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cfg));
}

export function loadMembers(): MemberAccount[] {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback to seed
  }
  const seed = createSeedMembers();
  saveMembers(seed);
  return seed;
}

export function saveMembers(members: MemberAccount[]): void {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

export function loadTelemetry(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  const seed = createSeedTelemetry();
  saveTelemetry(seed);
  return seed;
}

export function saveTelemetry(events: TelemetryEvent[]): void {
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(events));
}

export function appendTelemetry(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): TelemetryEvent[] {
  const current = loadTelemetry();
  const next: TelemetryEvent[] = [
    {
      ...event,
      id: `tel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 500);
  saveTelemetry(next);
  return next;
}

export function loadCurrentMemberId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function saveCurrentMemberId(id: string | null): void {
  if (id) {
    localStorage.setItem(CURRENT_USER_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function loadSiteVisits(): SiteVisitEvent[] {
  try {
    const raw = localStorage.getItem(VISITS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  const seed: SiteVisitEvent[] = [
    { id: 'v-1', timestamp: '2026-11-23T09:15:00Z', memberId: 'mem-student', memberName: 'Amina Kouassi (Étudiante)', device: 'desktop', language: 'fr', tab: 'planning' },
    { id: 'v-2', timestamp: '2026-11-24T14:20:00Z', memberId: 'mem-hotelier', memberName: 'Patrice Soglo (Hôtelier)', device: 'tablet', language: 'fr', tab: 'dashboard' },
    { id: 'v-3', timestamp: '2026-11-25T08:05:00Z', memberId: 'mem-admin', memberName: 'Jérôme Foguenne (Admin)', device: 'desktop', language: 'fr', tab: 'admin' },
  ];
  localStorage.setItem(VISITS_KEY, JSON.stringify(seed));
  return seed;
}

export function recordSiteVisit(params: {
  memberId?: string;
  memberName?: string;
  language: Language;
  tab: string;
}): SiteVisitEvent[] {
  const current = loadSiteVisits();
  const next: SiteVisitEvent[] = [
    {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
      memberId: params.memberId,
      memberName: params.memberName || 'Visiteur anonyme',
      device: detectDeviceType(),
      language: params.language,
      tab: params.tab,
    },
    ...current,
  ].slice(0, 1000);
  localStorage.setItem(VISITS_KEY, JSON.stringify(next));
  return next;
}
