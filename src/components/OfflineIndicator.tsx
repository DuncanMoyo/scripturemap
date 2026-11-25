import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--atlas-accent)]/40 bg-[var(--atlas-accent)]/15 text-[var(--atlas-accent-soft)] text-[11px] font-medium whitespace-nowrap shrink-0"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode</span>
    </div>
  );
}
