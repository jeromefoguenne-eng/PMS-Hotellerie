import type { MemberAccount, TelemetryEvent } from '../types/pms';
import { createSeedMembers, createSeedTelemetry } from '../data/seedData';

const MEMBERS_KEY = 'openpms_members_v1';
const TELEMETRY_KEY = 'openpms_telemetry_v1';
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
