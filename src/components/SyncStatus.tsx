interface SyncStatusProps {
  lastSync: string;
  loading: boolean;
}

export default function SyncStatus({ lastSync, loading }: SyncStatusProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur border border-zinc-800 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl opacity-60 hover:opacity-100 transition-opacity z-50">
      <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-emerald-500 animate-ping' : 'bg-zinc-700'}`} />
      <span className="text-[9px] font-mono tracking-widest text-zinc-500">
        SYNC <span className="text-zinc-300">{lastSync || '00:00:00'}</span>
      </span>
    </div>
  );
}
