import { CheckCircle2, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  collapsed?: boolean;
}

export function PWAInstallButton({ collapsed = false }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) {
    if (collapsed) return null;
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-[var(--atlas-secondary)] bg-[var(--atlas-secondary)]/10 border border-[var(--atlas-secondary)]/25">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate whitespace-nowrap">App Installed Offline</span>
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <button
      onClick={() => void promptInstall()}
      title="Install Scripture Atlas for offline study"
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors border border-[var(--atlas-accent)]/35 bg-[var(--atlas-accent)]/12 text-[var(--atlas-accent-soft)] hover:bg-[var(--atlas-accent)]/20 ${
        collapsed ? 'justify-center px-0' : ''
      }`}
    >
      <Download className="w-3.5 h-3.5 shrink-0" />
      {!collapsed && <span>Install Offline App</span>}
    </button>
  );
}
