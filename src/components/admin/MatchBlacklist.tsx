import { useEffect, useState } from 'react';
import { useThemeClasses } from '../../functions/themeStore';
import { Button } from '../ui/Button';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import {
  getBlacklistEntries,
  addToBlacklist,
  removeFromBlacklist,
  type BlacklistedMatch
} from '../../functions/matchBlacklist';

export default function MatchBlacklist() {
  const { textMuted, textMain, bgSurface, border } = useThemeClasses();
  const [blacklist, setBlacklist] = useState<BlacklistedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMatchId, setNewMatchId] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBlacklist = async () => {
    setLoading(true);
    const entries = await getBlacklistEntries();
    setBlacklist(entries);
    setLoading(false);
  };

  useEffect(() => {
    loadBlacklist();
  }, []);

  const handleAdd = async () => {
    const matchIdNum = parseInt(newMatchId);
    if (isNaN(matchIdNum)) {
      setMessage({ type: 'error', text: 'ID de partido inválido' });
      return;
    }

    setAdding(true);
    const success = await addToBlacklist(matchIdNum, reason || undefined);
    
    if (success) {
      setMessage({ type: 'success', text: 'Partido agregado a la blacklist' });
      setNewMatchId('');
      setReason('');
      loadBlacklist();
    } else {
      setMessage({ type: 'error', text: 'Error al agregar a la blacklist (posiblemente ya existe)' });
    }
    
    setAdding(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemove = async (matchId: number) => {
    const success = await removeFromBlacklist(matchId);
    if (success) {
      setMessage({ type: 'success', text: 'Partido removido de la blacklist' });
      loadBlacklist();
    } else {
      setMessage({ type: 'error', text: 'Error al remover de la blacklist' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className={`flex flex-col gap-4 p-6 rounded-2xl ${bgSurface} border ${border}`}>
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${textMain}`}>
          Blacklist de Partidos
        </h2>
        <span className={`text-xs ${textMuted}`}>
          {blacklist.length} partidos ocultos
        </span>
      </div>

      <div className={`text-sm ${textMuted}`}>
        Agrega IDs de partidos de la API para ocultarlos de la vista pública. 
        Los partidos en esta lista no se mostrarán aunque la API los siga enviando.
      </div>

      {/* Formulario para agregar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="number"
          placeholder="ID del partido (API)"
          value={newMatchId}
          onChange={(e) => setNewMatchId(e.target.value)}
          className={`flex-1 px-4 py-2 rounded-lg border ${border} bg-transparent ${textMain} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <input
          type="text"
          placeholder="Razón (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={`flex-1 px-4 py-2 rounded-lg border ${border} bg-transparent ${textMain} placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        <Button
          icon={Plus}
          label="Agregar"
          onClick={handleAdd}
          disabled={adding || !newMatchId}
        />
      </div>

      {/* Mensaje de feedback */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          <AlertCircle size={16} />
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Lista de partidos en blacklist */}
      {loading ? (
        <div className={`text-sm ${textMuted}`}>Cargando...</div>
      ) : blacklist.length === 0 ? (
        <div className={`text-sm ${textMuted} italic`}>No hay partidos en la blacklist</div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {blacklist.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${border} bg-transparent`}
            >
              <div className="flex flex-col gap-1">
                <span className={`font-mono text-sm ${textMain}`}>
                  Match ID: {entry.match_id}
                </span>
                {entry.reason && (
                  <span className={`text-xs ${textMuted}`}>
                    Razón: {entry.reason}
                  </span>
                )}
                <span className={`text-xs ${textMuted}`}>
                  Agregado: {new Date(entry.created_at).toLocaleString('es-AR')}
                </span>
              </div>
              <Button
                icon={Trash2}
                label="Remover"
                onClick={() => handleRemove(entry.match_id)}
                variant="danger"
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
