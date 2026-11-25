import type { HotelProject, MemberAccount, TelemetryEvent } from '../types/pms';
import { addDays, diffNights } from './format';

export type TimeGranularity = 'day' | 'week' | 'month' | 'year' | 'total';

export interface PeriodStatPoint {
  key: string;
  label: string;
  reservationsCount: number;
  occupiedRoomNights: number;
  capacityRoomNights: number;
  occupancyRate: number;
  roomRevenue: number;
  extrasRevenue: number;
  totalRevenue: number;
  itemsSold: number;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-S${String(weekNo).padStart(2, '0')}`;
}

export function getPeriodKey(dateStr: string, granularity: TimeGranularity): string {
  if (granularity === 'day') return dateStr;
  if (granularity === 'week') return getWeekKey(dateStr);
  if (granularity === 'month') return dateStr.slice(0, 7);
  if (granularity === 'year') return dateStr.slice(0, 4);
  return 'TOTAL';
}

export function formatPeriodLabel(key: string, granularity: TimeGranularity): string {
  if (granularity === 'day') return key.slice(5); // MM-DD
  if (granularity === 'week') return key; // YYYY-SWW
  if (granularity === 'month') return key; // YYYY-MM
  if (granularity === 'year') return key; // YYYY
  return 'Total';
}

/**
 * Computes detailed time-series statistics for one or multiple HotelProjects
 * across Day, Week, Month, Year, or Total granularity.
 */
export function computeProjectsAnalytics(
  projects: HotelProject[],
  granularity: TimeGranularity
): {
  series: PeriodStatPoint[];
  totals: PeriodStatPoint;
  byChannel: { label: string; count: number; revenue: number }[];
  byRoomType: { label: string; count: number; revenue: number }[];
} {
  const buckets = new Map<string, PeriodStatPoint>();
  const channelMap = new Map<string, { count: number; revenue: number }>();
  const roomTypeMap = new Map<string, { count: number; revenue: number }>();

  const ensureBucket = (key: string): PeriodStatPoint => {
    let b = buckets.get(key);
    if (!b) {
      b = {
        key,
        label: formatPeriodLabel(key, granularity),
        reservationsCount: 0,
        occupiedRoomNights: 0,
        capacityRoomNights: 0,
        occupancyRate: 0,
        roomRevenue: 0,
        extrasRevenue: 0,
        totalRevenue: 0,
        itemsSold: 0,
      };
      buckets.set(key, b);
    }
    return b;
  };

  let totalCapacityPerDay = 0;

  for (const proj of projects) {
    const operationalRooms = Math.max(
      1,
      proj.rooms.filter((r) => r.status !== 'out_of_order').length
    );
    totalCapacityPerDay += operationalRooms;

    // Seed a clean window around simulatedDate for 'day' view so charts always show context
    if (granularity === 'day') {
      for (let offset = -5; offset <= 4; offset++) {
        const d = addDays(proj.simulatedDate, offset);
        const b = ensureBucket(d);
        b.capacityRoomNights += operationalRooms;
      }
    }

    for (const res of proj.reservations) {
      if (res.status === 'cancelled' || res.status === 'no_show') continue;
      const nights = diffNights(res.checkIn, res.checkOut);
      const resRoomRev = res.nightlyRate * nights;

      // Channel & RoomType breakdown
      const ch = channelMap.get(res.channel) || { count: 0, revenue: 0 };
      ch.count += 1;
      ch.revenue += resRoomRev;
      channelMap.set(res.channel, ch);

      const rt = roomTypeMap.get(res.roomType) || { count: 0, revenue: 0 };
      rt.count += 1;
      rt.revenue += resRoomRev;
      roomTypeMap.set(res.roomType, rt);

      // Count reservation on its checkIn period
      const checkInKey = getPeriodKey(res.checkIn, granularity);
      const checkInBucket = ensureBucket(checkInKey);
      checkInBucket.reservationsCount += 1;

      // Distribute occupied room-nights across stay dates
      for (let n = 0; n < nights; n++) {
        const stayDate = addDays(res.checkIn, n);
        const pKey = getPeriodKey(stayDate, granularity);
        const b = ensureBucket(pKey);
        b.occupiedRoomNights += 1;
        b.roomRevenue += res.nightlyRate;
      }
    }

    // Extras & items sold from Folios
    for (const fol of proj.folios) {
      for (const item of fol.items) {
        if (item.category === 'room' || item.category === 'tax') continue;
        const pKey = getPeriodKey(item.date, granularity);
        const b = ensureBucket(pKey);
        const amount = item.quantity * item.unitPrice;
        b.extrasRevenue += amount;
        if (item.unitPrice > 0) {
          b.itemsSold += item.quantity;
        }
      }
    }
  }

  // Finalize capacity & occupancy rate per bucket
  const sortedKeys = Array.from(buckets.keys()).sort();
  const series: PeriodStatPoint[] = sortedKeys.map((key) => {
    const b = buckets.get(key)!;
    let cap = b.capacityRoomNights;
    if (cap === 0) {
      const daysMultiplier =
        granularity === 'day'
          ? 1
          : granularity === 'week'
          ? 7
          : granularity === 'month'
          ? 30
          : granularity === 'year'
          ? 365
          : 30;
      cap = Math.max(1, totalCapacityPerDay * daysMultiplier);
    }
    b.capacityRoomNights = cap;
    b.occupancyRate = Math.min(100, Math.round((b.occupiedRoomNights / cap) * 100));
    b.totalRevenue = b.roomRevenue + b.extrasRevenue;
    return b;
  });

  const totals = series.reduce<PeriodStatPoint>(
    (acc, cur) => ({
      key: 'TOTAL',
      label: 'Total',
      reservationsCount: acc.reservationsCount + cur.reservationsCount,
      occupiedRoomNights: acc.occupiedRoomNights + cur.occupiedRoomNights,
      capacityRoomNights: acc.capacityRoomNights + cur.capacityRoomNights,
      occupancyRate: 0,
      roomRevenue: acc.roomRevenue + cur.roomRevenue,
      extrasRevenue: acc.extrasRevenue + cur.extrasRevenue,
      totalRevenue: acc.totalRevenue + cur.totalRevenue,
      itemsSold: acc.itemsSold + cur.itemsSold,
    }),
    {
      key: 'TOTAL',
      label: 'Total',
      reservationsCount: 0,
      occupiedRoomNights: 0,
      capacityRoomNights: 0,
      occupancyRate: 0,
      roomRevenue: 0,
      extrasRevenue: 0,
      totalRevenue: 0,
      itemsSold: 0,
    }
  );
  totals.occupancyRate =
    totals.capacityRoomNights > 0
      ? Math.min(100, Math.round((totals.occupiedRoomNights / totals.capacityRoomNights) * 100))
      : 0;

  return {
    series,
    totals,
    byChannel: Array.from(channelMap.entries()).map(([label, v]) => ({ label, ...v })),
    byRoomType: Array.from(roomTypeMap.entries()).map(([label, v]) => ({ label, ...v })),
  };
}

/**
 * Aggregates Admin-level telemetry + project occupancy across members.
 */
export function computeAdminAnalytics(
  members: MemberAccount[],
  telemetry: TelemetryEvent[],
  granularity: TimeGranularity,
  filterMemberId: string
) {
  const filteredMembers =
    filterMemberId === 'ALL' ? members : members.filter((m) => m.id === filterMemberId);
  const allProjects = filteredMembers.flatMap((m) => m.projects);
  const projectAnalytics = computeProjectsAnalytics(allProjects, granularity);

  const filteredEvents =
    filterMemberId === 'ALL'
      ? telemetry
      : telemetry.filter((t) => t.memberId === filterMemberId);

  const activityByPeriod = new Map<string, { label: string; events: number; revenue: number }>();
  for (const ev of filteredEvents) {
    const dateStr = ev.timestamp.slice(0, 10);
    const key = getPeriodKey(dateStr, granularity);
    const cur = activityByPeriod.get(key) || {
      label: formatPeriodLabel(key, granularity),
      events: 0,
      revenue: 0,
    };
    cur.events += 1;
    cur.revenue += ev.revenueDelta;
    activityByPeriod.set(key, cur);
  }

  return {
    ...projectAnalytics,
    activitySeries: Array.from(activityByPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v),
  };
}
