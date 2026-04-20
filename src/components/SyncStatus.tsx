interface SyncStatusProps {
  lastSync: string;
  loading: boolean;
}

export default function SyncStatus({ lastSync, loading }: SyncStatusProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl z-50">
      <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-emerald-500 animate-ping' : 'bg-zinc-500'}`} />
      <span className="text-[10px] font-mono tracking-widest text-zinc-400">
        SYNC <span className="text-white font-bold">{lastSync || '00:00:00'}</span>
      </span>
    </div>
  );
}
