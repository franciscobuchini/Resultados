

import { useThemeClasses } from '../../functions/themeStore';

export default function ReadmeViewer() {
  const { textMain, textMuted } = useThemeClasses();

  return (
    <div className={`max-w-4xl mx-auto px-6 ${textMain}`}>
      <h2 className="text-2xl font-bold mb-4">Tareas pendientes</h2>
      <ul className={`space-y-2 ${textMuted}`}>
        <li>- Goles desde 2020</li>
        <li>- Sistema de inicio de sesión, perfiles, etc</li>
        <li>- Partidos únicos entre campeonatos</li>
      </ul>
    </div>
  )
}
