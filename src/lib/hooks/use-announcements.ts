'use client';

import { fetchAnnouncements } from '@/lib/api/spot-client';
import { usePolling } from './use-polling';
import type { AnnouncementGroup } from '@/lib/api/types';

const ANNOUNCEMENTS_INTERVAL = 86_400_000;

export function useAnnouncements() {
  return usePolling<AnnouncementGroup[]>(fetchAnnouncements, ANNOUNCEMENTS_INTERVAL);
}
