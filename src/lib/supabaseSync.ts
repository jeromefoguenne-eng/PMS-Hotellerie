import type { MemberAccount, TelemetryEvent } from '../types/pms';
import type { CloudConfig } from './storage';

export const SUPABASE_SQL_SCHEMA = `-- Exécutez ce script dans Supabase > SQL Editor pour activer la synchro multi-appareils :
CREATE TABLE IF NOT EXISTS openpms_store (
  id TEXT PRIMARY KEY,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  telemetry JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE openpms_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read/write for OpenPMS" ON openpms_store FOR ALL USING (true) WITH CHECK (true);`;

export async function pushStateToSupabase(
  cfg: CloudConfig,
  members: MemberAccount[],
  telemetry: TelemetryEvent[]
): Promise<boolean> {
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return false;
  try {
    const base = cfg.supabaseUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/rest/v1/openpms_store`, {
      method: 'POST',
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: 'global_v1',
        members,
        telemetry,
        updated_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pullStateFromSupabase(
  cfg: CloudConfig
): Promise<{ members: MemberAccount[]; telemetry: TelemetryEvent[] } | null> {
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  try {
    const base = cfg.supabaseUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/rest/v1/openpms_store?id=eq.global_v1&select=members,telemetry`, {
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { members: MemberAccount[]; telemetry: TelemetryEvent[] }[];
    if (rows.length > 0 && Array.isArray(rows[0].members)) {
      return rows[0];
    }
    return null;
  } catch {
    return null;
  }
}
