import { useEffect, useState } from 'react'

export default function ReadmeViewer() {
  const [content, setContent] = useState('')

  useEffect(() => {
    // En Vite podemos importar archivos locales usando fetch o import?raw
    // Para simplificar y que sea dinámico, lo leemos de la raíz
    fetch('/README.md')
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(() => setContent('No se pudo cargar el README.md'))
  }, [])

  if (!content) return null

  return (
    <div className="max-w-4xl mx-auto mt-20 mb-32 px-6">
      <div className="border-t border-zinc-800 pt-8">
        <h3 className="text-zinc-500 text-[10px] font-mono uppercase mb-6 tracking-widest">
          Documentación / Notas del Proyecto
        </h3>
        <div className="bg-zinc-950/50 border border-zinc-900 rounded-xl p-8 shadow-2xl">
          <pre className="text-zinc-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    </div>
  )
}
