import type { HotelProject } from '../types/pms';

const SALT_PREFIX = 'openhotelpms-v1:';

/**
 * Computes a salted SHA-256 hex digest using the browser Web Crypto API.
 */
export async function hashPassword(email: string, password: string): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const payload = `${SALT_PREFIX}${normalizedEmail}:${password}`;
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Enforces strong password policy on registration.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre majuscule.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins un caractère spécial (ex: @, !, #).';
  }
  return null;
}

/**
 * Prevents CSV Formula Injection (CWE-1236) in Excel/LibreOffice exports.
 */
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value);
  const needsPrefix = /^[=+\-@\t\r]/.test(str);
  const safe = needsPrefix ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Safely validates and strips dangerous prototype keys from imported JSON projects.
 */
export function parseSafeImportedProject(jsonText: string): HotelProject | null {
  try {
    const parsed = JSON.parse(jsonText, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined;
      }
      return value;
    });
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.name !== 'string' ||
      !parsed.config ||
      typeof parsed.config.hotelName !== 'string' ||
      !Array.isArray(parsed.rooms) ||
      !Array.isArray(parsed.reservations)
    ) {
      return null;
    }
    return parsed as HotelProject;
  } catch {
    return null;
  }
}
