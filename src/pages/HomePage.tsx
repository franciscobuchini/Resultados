import { useEffect, useState } from 'react'
import PageBanner from '../layout/PageBanner'
import { useThemeClasses } from '../functions/themeStore'

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const { border, textMain } = useThemeClasses()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Solo mantenemos una carga mínima si fuera necesario, 
      // pero por ahora solo simulamos la carga para el spinner
      await new Promise(resolve => setTimeout(resolve, 500))
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className={`w-12 h-12 border-4 ${border} border-t-current ${textMain} rounded-full animate-spin`} />
    </div>
  )

  return (
    <>
      <PageBanner 
        title="Resultados.ar" 
        tournament_banner_url="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093&auto=format&fit=crop"
      />
    </>
  )
}
