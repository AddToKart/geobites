import { useCallback, useEffect, useRef, useState } from 'react';
import type { Vendor } from '@/types';

export interface VendorOpenStatus {
  isScheduledOpen: boolean;
  isTemporarilyClosed: boolean;
  isEffectivelyOpen: boolean;
  todayLabel: string;
  scheduleText: string;
}

function parseHHMM(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

function formatTime(hhmm: string): string {
  const { hour, minute } = parseHHMM(hhmm);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayH = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayH}:${String(minute).padStart(2, '0')} ${period}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function computeStatus(vendor: Vendor | null): VendorOpenStatus {
  if (!vendor) {
    return {
      isScheduledOpen: false,
      isTemporarilyClosed: false,
      isEffectivelyOpen: false,
      todayLabel: '--',
      scheduleText: 'No schedule set',
    };
  }

  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sun, 6 = Sat
  const todayLabel = DAY_NAMES[todayIndex];
  const isTempClosed = (vendor as any).isTemporarilyClosed ?? false;

  const hours = vendor.operatingHours;
  if (!hours || hours.length === 0) {
    const isEffective = vendor.isActive && !isTempClosed;
    return {
      isScheduledOpen: vendor.isActive,
      isTemporarilyClosed: isTempClosed,
      isEffectivelyOpen: isEffective,
      todayLabel,
      scheduleText: 'No schedule configured',
    };
  }

  const todayHours = hours.find((h) => h.dayOfWeek === todayIndex);
  if (!todayHours || todayHours.isClosed) {
    return {
      isScheduledOpen: false,
      isTemporarilyClosed: isTempClosed,
      isEffectivelyOpen: false,
      todayLabel,
      scheduleText: 'Closed today',
    };
  }

  const { hour: openH, minute: openM } = parseHHMM(todayHours.openTime);
  const { hour: closeH, minute: closeM } = parseHHMM(todayHours.closeTime);

  const openDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openH, openM);
  const closeDt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeH, closeM);

  const isScheduledOpen = vendor.isActive && now >= openDt && now < closeDt;
  const isEffectivelyOpen = isScheduledOpen && !isTempClosed;
  const scheduleText = `${formatTime(todayHours.openTime)} – ${formatTime(todayHours.closeTime)}`;

  return {
    isScheduledOpen,
    isTemporarilyClosed: isTempClosed,
    isEffectivelyOpen,
    todayLabel,
    scheduleText,
  };
}

/**
 * Returns the current open/closed status of a vendor, re-computed every 60 s.
 * `vendor` must include `operatingHours` and `isTemporarilyClosed`.
 */
export function useVendorOpenStatus(vendor: Vendor | null): VendorOpenStatus {
  const [status, setStatus] = useState<VendorOpenStatus>(() => computeStatus(vendor));
  const vendorRef = useRef(vendor);
  vendorRef.current = vendor;

  const refresh = useCallback(() => {
    setStatus(computeStatus(vendorRef.current));
  }, []);

  // Recompute whenever vendor data changes
  useEffect(() => {
    refresh();
  }, [vendor, refresh]);

  // Re-check every minute so the status flips automatically at open/close time
  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return status;
}
