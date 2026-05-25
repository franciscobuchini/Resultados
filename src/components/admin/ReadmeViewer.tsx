import { useEffect, useState } from 'react';
import { supabase } from '../../functions/supabase';
import { useThemeClasses } from '../../functions/themeStore';
import { Plus, Trash2, Check } from 'lucide-react';

type Assignee = 'FRAN' | 'JAVI' | 'AMBOS' | 'NOTA';
type Status   = 'pending' | 'done';

interface Task {
  id: string;
  text: string;
  assignee: Assignee;
  status: Status;
  createdAt: string;
}

const ASSIGNEE_COLORS: Record<Assignee, string> = {
  FRAN:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  JAVI:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  AMBOS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  NOTA:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const STORAGE_ID = 'readme_tasks';

export default function ReadmeViewer() {
  const { textMain, textMuted, bgSurface, border } = useThemeClasses();
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState<Status | 'all'>('pending');
  const [newText, setNewText]         = useState('');
  const [newAssignee, setNewAssignee] = useState<Assignee>('AMBOS');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('apis')
        .select('data')
        .eq('id', STORAGE_ID)
        .maybeSingle();

      console.log('Load result:', data, 'Error:', error);

      if (data?.data && Array.isArray(data.data)) {
        setTasks(data.data as Task[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async (updated: Task[]) => {
    setSaving(true);
    const { error } = await supabase
      .from('apis')
      .upsert(
        { id: STORAGE_ID, data: updated, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    console.log('Save error:', error);
    setSaving(false);
  };

  const addTask = async () => {
    if (!newText.trim()) return;
    const task: Task = {
      id:        crypto.randomUUID(),
      text:      newText.trim(),
      assignee:  newAssignee,
      status:    'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    await save(updated);
    setNewText('');
  };

  const toggleStatus = async (id: string) => {
    const updated = tasks.map(t =>
      t.id === id
        ? { ...t, status: (t.status === 'done' ? 'pending' : 'done') as Status }
        : t
    );
    setTasks(updated);
    await save(updated);
  };

  const deleteTask = async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await save(updated);
  };

  const filtered     = tasks.filter(t => filter === 'all' || t.status === filter);
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const doneCount    = tasks.filter(t => t.status === 'done').length;

  if (loading) return (
    <div className={`p-8 text-center text-sm ${textMuted}`}>Cargando tareas...</div>
  );

  return (
    <div className={`max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6 ${textMain}`}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tareas</h2>
          <p className={`text-sm mt-0.5 ${textMuted}`}>
            {pendingCount} pendientes · {doneCount} completadas
            {saving && <span className="ml-2 opacity-50">· guardando...</span>}
          </p>
        </div>

        {/* Filtros */}
        <div className={`flex gap-1 text-xs rounded-lg p-1 ${bgSurface} border ${border}`}>
          {(['pending', 'done', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filter === f ? 'bg-white/10 font-medium' : `${textMuted} hover:text-current`
              }`}
            >
              {f === 'pending' ? 'Pendientes' : f === 'done' ? 'Completadas' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {/* Form nueva tarea */}
      <div className={`rounded-xl border ${border} ${bgSurface} p-4 flex flex-col gap-3`}>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            placeholder="Nueva tarea..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            className={`flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:opacity-40 ${textMain}`}
          />
          <button
            onClick={addTask}
            disabled={!newText.trim()}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-30 shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Selector de asignado */}
        <div className="flex gap-1 flex-wrap">
          {(['FRAN', 'JAVI', 'AMBOS', 'NOTA'] as Assignee[]).map(a => (
            <button
              key={a}
              onClick={() => setNewAssignee(a)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                newAssignee === a
                  ? ASSIGNEE_COLORS[a]
                  : `${textMuted} border-transparent hover:border-white/10`
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de tareas */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className={`text-center py-12 text-sm ${textMuted} opacity-50`}>
            No hay tareas {filter === 'pending' ? 'pendientes' : filter === 'done' ? 'completadas' : ''}
          </div>
        )}

        {filtered.map(task => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 p-3.5 rounded-xl border ${border} ${bgSurface} transition-all hover:border-white/20 ${
              task.status === 'done' ? 'opacity-50' : ''
            }`}
          >
            {/* Checkbox — oculto para NOTA */}
            {task.assignee !== 'NOTA' ? (
              <button
                onClick={() => toggleStatus(task.id)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  task.status === 'done'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                {task.status === 'done' && <Check size={11} strokeWidth={3} />}
              </button>
            ) : (
              <div className="w-5 h-5 shrink-0" />
            )}

            {/* Texto */}
            <p className={`flex-1 text-sm min-w-0 ${task.status === 'done' ? 'line-through' : ''}`}>
              {task.text}
            </p>

            {/* Asignado */}
            <span className={`text-xs px-2 py-0.5 rounded-md border font-medium shrink-0 ${ASSIGNEE_COLORS[task.assignee]}`}>
              {task.assignee}
            </span>

            {/* Eliminar */}
            <button
              onClick={() => deleteTask(task.id)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500/20 hover:text-red-400 ${textMuted} shrink-0`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}