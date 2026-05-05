import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import TournamentPage from './pages/TournamentPage'
import AdminPage from './pages/AdminPage'
import Error404 from './pages/Error404'
import { useEffect, useState } from 'react'
import { supabase } from './functions/supabase'

export default function App() {
  const [defaultTournamentId, setDefaultTournamentId] = useState<string | null>(null)

  useEffect(() => {
    const fetchDefault = async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('tournament_id')
        .order('tournament_banner_url', { ascending: false, nullsFirst: false })
        .limit(1)
        .single()
      
      if (data) setDefaultTournamentId(data.tournament_id)
    }
    fetchDefault()
  }, [])

  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          {/* Redirigir la raíz al torneo por defecto si existe */}
          <Route path="/" element={
            defaultTournamentId 
              ? <Navigate to={`/tournament/${defaultTournamentId}`} replace /> 
              : <div className="p-20 text-center text-zinc-500 font-black uppercase tracking-widest animate-pulse">Cargando Competición...</div>
          } />
          
          <Route path="/tournament/:tournamentId" element={<TournamentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          
          {/* Capturar todo lo demás como 404 */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}
