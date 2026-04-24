import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '../functions/supabase'

// ── Tipos ──────────────────────────────────────────────
interface RawMatch {
  Fecha: string; Lugar: string; Equipo1: string; Goles1: number
  Goleadores1: string; Equipo2: string; Goles2: number; Goleadores2: string
  Notas: string; N_Fecha: string; Estadio: string; Estadio_Wikiname: string
  Pais: string[]; Temporada: (number | string)[]; Categoria: string[]
  Torneo: string[]; Subdivision: string[]
}

interface DbTeam { team_id: string; team_name: string | null }
interface DbCountry { country_id: string; country_name: string | null }
interface DbTournament { tournament_id: string; tournament_name: string | null }

interface TournamentConfig {
  tournament_name: string; tournament_tier: number | null
  tournament_edition: string; tournament_year: string
  tournament_country_id: string; generatedId: string
  exists: boolean
}

interface MappedMatch {
  match_id: string; match_date: string; match_time_utc: string
  match_status: string; game_time: number
  home_id: string; home_name: string; home_score: number | null
  away_id: string; away_name: string; away_score: number | null
  home_penalty: number | null; away_penalty: number | null
  tournament_id: string; match_round: string
  stadium_name: string | null; match_notes: string | null
}

interface GoalRow {
  goal_id: string; match_id: string; team_id: string
  goal_minute: number; player_name: string; goal_type: string
}

// ── Helpers ────────────────────────────────────────────
function parseDate(f: string): string {
  const [dd, mm, yyyy] = f.split('/');
  return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

function t(s: string) { return s?.trim() || '' }

function parseTier(cat: string): number | null {
  const m = cat.match(/(\d+)/); return m ? parseInt(m[1]) : null
}

function genTournamentId(cid: string, tier: number | null, ed: string, yr: string) {
  return `${t(cid)}${tier ?? ''}${t(ed)}${t(yr)}`
}

function parseGoals(str: string, matchId: string, teamId: string, side: 'H'|'A'): GoalRow[] {
  if (!str?.trim()) return []
  const goals: GoalRow[] = []
  const parts = str.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    const m = parts[i].match(/^(\d+)(?:\+(\d+))?[''´']\s*(.+)$/)
    if (!m) continue
    const minute = parseInt(m[1]) + (m[2] ? parseInt(m[2]) : 0)
    let player = m[3].trim()
    let gtype = 'G'
    if (/\(p(?:enal)?\)/i.test(player)) { gtype = 'P'; player = player.replace(/\s*\(p(?:enal)?\)/i, '').trim() }
    else if (/\(e\.?c\.?\)/i.test(player)) { gtype = 'C'; player = player.replace(/\s*\(e\.?c\.?\)/i, '').trim() }
    goals.push({ goal_id: `${matchId}_${side}${i+1}`, match_id: matchId, team_id: teamId, goal_minute: minute, player_name: player, goal_type: gtype })
  }
  return goals
}

function parsePenalties(notes: string, home: string, away: string) {
  if (!notes || !/penal/i.test(notes)) return { hp: null, ap: null }
  const m = notes.match(/(\d+)\s*-\s*(\d+)/)
  if (!m) return { hp: null, ap: null }
  
  const s1 = parseInt(m[1]), s2 = parseInt(m[2])
  const win = Math.max(s1, s2), los = Math.min(s1, s2)
  
  // Fuzzy Match: buscamos palabras significativas del equipo en la nota
  const check = (name: string) => {
    const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    return words.some(w => notes.toLowerCase().includes(w))
  }

  if (check(home)) return { hp: win, ap: los }
  if (check(away)) return { hp: los, ap: win }
  return { hp: null, ap: null }
}

// ── Componente ─────────────────────────────────────────
export default function JsonImporter() {
  const [teams, setTeams] = useState<DbTeam[]>([])
  const [countries, setCountries] = useState<DbCountry[]>([])
  const [existingTournaments, setExistingTournaments] = useState<DbTournament[]>([])
  const [loading, setLoading] = useState(true)

  const [jsonText, setJsonText] = useState('')
  const [mapped, setMapped] = useState<MappedMatch[]>([])
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [tourney, setTourney] = useState<TournamentConfig | null>(null)

  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ok: boolean; msg: string} | null>(null)

  // Crear equipo nuevo
  const [newTeam, setNewTeam] = useState<{id: string; api: string; name: string; country: string} | null>(null)
  const [creatingTeam, setCreatingTeam] = useState(false)

  // Cargar datos de referencia
  useEffect(() => {
    (async () => {
      const [r1, r2, r3] = await Promise.all([
        supabase.from('teams').select('team_id, team_name').order('team_id'),
        supabase.from('countries').select('country_id, country_name'),
        supabase.from('tournaments').select('tournament_id, tournament_name'),
      ])
      setTeams((r1.data || []).map(x => ({ team_id: t(x.team_id), team_name: x.team_name })))
      setCountries((r2.data || []).map(x => ({ country_id: t(x.country_id), country_name: x.country_name })))
      setExistingTournaments((r3.data || []).map(x => ({ tournament_id: t(x.tournament_id), tournament_name: x.tournament_name })))
      setLoading(false)
    })()
  }, [])

  // Memoria persistente: nombre → team_id (localStorage)
  const STORAGE_KEY = 'importer_team_map'
  const [nameMap, setNameMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  })

  const saveNameMap = (updated: Record<string, string>) => {
    setNameMap(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  // Mapa nombre → team_id (DB + memoria)
  const teamByName = useMemo(() => {
    const m = new Map<string, string>()
    for (const te of teams) if (te.team_name) m.set(te.team_name.toLowerCase().trim(), te.team_id)
    // Sobreescribir con memoria local (prioridad)
    for (const [k, v] of Object.entries(nameMap)) m.set(k.toLowerCase().trim(), v)
    return m
  }, [teams, nameMap])

  const countryByName = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of countries) if (c.country_name) m.set(c.country_name.toLowerCase().trim(), c.country_id)
    return m
  }, [countries])

  const resolveTeam = useCallback((name: string): string => {
    return teamByName.get(name.toLowerCase().trim()) || ''
  }, [teamByName])

  // Procesar JSON
  const processJson = useCallback(() => {
    if (!jsonText.trim()) return
    try {
      const text = jsonText.trim()
      
      // Verificación de "palabra clave" al final
      if (!text.toLowerCase().endsWith('ok')) {
        setResult({ ok: false, msg: '⚠ Acceso denegado: Se requiere la palabra clave al final del JSON.' })
        return
      }

      // Quitamos el "ok" del final para poder parsear el JSON
      const cleanJson = text.slice(0, -2).trim()
      const raw: RawMatch[] = JSON.parse(cleanJson)
      if (!Array.isArray(raw) || raw.length === 0) { setResult({ ok: false, msg: 'JSON vacío o no es un array' }); return }

      // Detectar torneo del primer registro
      const first = raw[0]
      const paisName = first.Pais?.[0] || ''
      // Buscar ID de país o usar 'ARG' por defecto
      const countryId = countryByName.get(paisName.toLowerCase().trim()) || 'ARG'
      const tier = parseTier(first.Categoria?.[0] || '')
      const torneoRaw = first.Torneo?.[0] || ''
      const edition = "" // Edición vacía por defecto
      const yearRaw = first.Temporada?.[0]
      const year = yearRaw ? String(yearRaw).trim() : ''
      
      const gid = genTournamentId(countryId, tier, edition, year)
      const exists = existingTournaments.some(et => t(et.tournament_id) === gid)

      setTourney({ 
        tournament_name: torneoRaw, 
        tournament_tier: tier, 
        tournament_edition: edition, 
        tournament_year: year, 
        tournament_country_id: countryId, 
        generatedId: gid, 
        exists 
      })

      // Mapear partidos
      const allGoals: GoalRow[] = []
      const matches = raw.map((r) => {
        const matchDate = parseDate(r.Fecha)
        const homeId = resolveTeam(r.Equipo1)
        const awayId = resolveTeam(r.Equipo2)
        const datePart = matchDate.replace(/-/g, '')
        const matchId = (homeId && awayId) ? `${datePart}${homeId}${awayId}` : ''

        const penalties = parsePenalties(r.Notas, r.Equipo1, r.Equipo2)

        const match: MappedMatch = {
          match_id: matchId, match_date: matchDate, match_time_utc: '00:00:00',
          match_status: 'Finalizado', game_time: 0,
          home_id: homeId, home_name: r.Equipo1, home_score: r.Goles1 ?? null,
          away_id: awayId, away_name: r.Equipo2, away_score: r.Goles2 ?? null,
          home_penalty: penalties.hp, away_penalty: penalties.ap,
          tournament_id: gid, match_round: /^\d+$/.test(String(r.N_Fecha || '').trim()) ? `Fecha ${String(r.N_Fecha).trim()}` : (r.N_Fecha || 'Fase Regular'),
          stadium_name: r.Estadio || null, match_notes: r.Notas || null,
        }

        // Parsear goles
        if (matchId && homeId) allGoals.push(...parseGoals(r.Goleadores1, matchId, homeId, 'H'))
        if (matchId && awayId) allGoals.push(...parseGoals(r.Goleadores2, matchId, awayId, 'A'))

        return match
      })

      setMapped(matches)
      setGoals(allGoals)
      setResult(null)
    } catch (e) {
      setResult({ ok: false, msg: `Error: ${(e as Error).message}` })
    }
  }, [jsonText, resolveTeam, countryByName, existingTournaments])

  // Editar team_id manualmente — propaga + guarda en memoria
  const handleTeamChange = (idx: number, side: 'home'|'away', val: string) => {
    setMapped(prev => {
      const changed = { ...prev[idx] }
      const teamName = side === 'home' ? changed.home_name : changed.away_name

      // Guardar en memoria persistente
      if (val && teamName) {
        saveNameMap({ ...nameMap, [teamName.toLowerCase().trim()]: val })
      }

      return prev.map((row, i) => {
        const r = { ...row }
        if (i === idx) {
          if (side === 'home') r.home_id = val; else r.away_id = val
        } else {
          // Propagar a todas las filas donde aparezca el mismo nombre
          if (r.home_name === teamName && !r.home_id) r.home_id = val
          if (r.away_name === teamName && !r.away_id) r.away_id = val
        }
        const dp = r.match_date.replace(/-/g, '')
        r.match_id = (r.home_id && r.away_id) ? `${dp}${r.home_id}${r.away_id}` : ''
        return r
      })
    })
  }

  // Crear equipo nuevo
  const handleCreateTeam = async () => {
    if (!newTeam || !newTeam.id.trim() || !newTeam.name.trim()) return
    setCreatingTeam(true)
    try {
      const apiId = parseInt(newTeam.api)

      const { error } = await supabase.from('teams').insert({
        team_id: newTeam.id.trim().padEnd(6, ' '),
        team_id_api: (isNaN(apiId) || apiId === 0) ? null : apiId,
        team_name: newTeam.name.trim(),
        team_country_id: newTeam.country || null,
      })
      if (error) throw error
      // Recargar equipos
      const { data } = await supabase.from('teams').select('team_id, team_name').order('team_id')
      if (data) setTeams(data.map(x => ({ team_id: t(x.team_id), team_name: x.team_name })))
      setResult({ ok: true, msg: `✓ Equipo "${newTeam.name}" creado (${newTeam.id})` })
      setNewTeam(null)
    } catch (e) {
      setResult({ ok: false, msg: `Error creando equipo: ${(e as Error).message}` })
    } finally { setCreatingTeam(false) }
  }

  // Abrir form de nuevo equipo pre-llenando el nombre
  const openNewTeam = (name: string) => {
    setNewTeam({ id: '', api: '0', name, country: '' })
  }

  // Editar config de torneo
  const updateTourney = (field: string, val: string | number | null) => {
    if (!tourney) return
    const u = { ...tourney, [field]: val }
    u.generatedId = genTournamentId(u.tournament_country_id, u.tournament_tier, u.tournament_edition, u.tournament_year)
    u.exists = existingTournaments.some(et => t(et.tournament_id) === u.generatedId)
    setTourney(u)
    // Actualizar tournament_id en todos los matches
    setMapped(prev => prev.map(m => ({ ...m, tournament_id: u.generatedId })))
  }

  // Importar
  const tourneyComplete = tourney && tourney.tournament_edition.trim() !== ''
  const matchesComplete = mapped.length > 0 && mapped.every(m => m.match_id !== '')
  const allComplete = tourneyComplete && matchesComplete
  const incompleteCount = mapped.filter(m => m.match_id === '').length

  const handleImport = async () => {
    if (!allComplete || !tourney) return
    setUploading(true); setResult(null)
    try {
      // 1. Crear torneo si no existe
      if (!tourney.exists) {
        const { error: tErr } = await supabase.from('tournaments').insert({
          tournament_name: tourney.tournament_name,
          tournament_tier: tourney.tournament_tier,
          tournament_edition: tourney.tournament_edition,
          tournament_year: tourney.tournament_year,
          tournament_country_id: tourney.tournament_country_id || null,
        })
        if (tErr && !tErr.message.includes('duplicate')) throw tErr
      }

      // 2. Upsert partidos
      const { error: mErr } = await supabase.from('matches').upsert(mapped, { onConflict: 'match_id' })
      if (mErr) throw mErr

      // 3. Insertar goles (borrar existentes primero para esos match_ids)
      if (goals.length > 0) {
        const matchIds = [...new Set(goals.map(g => g.match_id))]
        await supabase.from('goals').delete().in('match_id', matchIds)
        const { error: gErr } = await supabase.from('goals').insert(goals)
        if (gErr) throw gErr
      }

      setResult({ ok: true, msg: `✓ ${mapped.length} partidos + ${goals.length} goles importados${!tourney.exists ? ' + torneo creado' : ''}` })
      setMapped([]); setGoals([]); setJsonText(''); setTourney(null)

      // Recargar torneos para que el próximo import detecte los existentes
      const { data: tData } = await supabase.from('tournaments').select('tournament_id, tournament_name')
      if (tData) setExistingTournaments(tData.map(x => ({ tournament_id: t(x.tournament_id), tournament_name: x.tournament_name })))
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message })
    } finally { setUploading(false) }
  }

  if (loading) return <div className="p-4 text-zinc-600 text-xs font-mono">Cargando datos de referencia...</div>

  // ── Render ───────────────────────────────────────────
  return (
    <div className="p-4 pb-8">
      <h2 className="text-zinc-500 text-xs font-mono uppercase mb-4 px-2">
        Importar JSON
        <span className="text-zinc-700 ml-3 normal-case">({teams.length} equipos · {countries.length} países · {existingTournaments.length} torneos)</span>
      </h2>

      {/* Área de pegado */}
      <div className="mb-4">
        <textarea
          className="w-full h-32 bg-black border border-zinc-800 rounded-lg p-3 text-[10px] font-mono text-zinc-300 resize-y outline-none focus:border-zinc-600 placeholder:text-zinc-700 transition-colors"
          placeholder='Pegá el JSON acá... [ { "Fecha": "22/11/2025", "Equipo1": "...", ... } ]'
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <button onClick={processJson} disabled={!jsonText.trim()}
            className="px-4 py-1.5 text-[10px] font-mono rounded font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors">
            Procesar JSON
          </button>
          {mapped.length > 0 && (
            <button onClick={() => { setMapped([]); setGoals([]); setTourney(null); setJsonText(''); setResult(null) }}
              className="px-3 py-1.5 text-[10px] font-mono bg-zinc-900 text-zinc-500 rounded hover:bg-zinc-800 transition-colors">
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div className={`mb-4 p-3 rounded text-xs font-mono ${result.ok ? 'bg-emerald-900/30 border border-emerald-800 text-emerald-300' : 'bg-red-900/30 border border-red-800 text-red-300'}`}>
          {result.msg}
        </div>
      )}

      {/* Crear equipo nuevo */}
      {newTeam && (
        <div className="mb-4 bg-blue-950/20 border border-blue-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Crear equipo nuevo</span>
            <button onClick={() => setNewTeam(null)} className="ml-auto text-zinc-600 hover:text-zinc-400 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[9px] font-mono text-zinc-600 uppercase block mb-1">ID (6 chars)</label>
              <input value={newTeam.id} maxLength={6} onChange={e => setNewTeam({...newTeam, id: e.target.value.toUpperCase()})}
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none focus:border-blue-800" placeholder="ARG001" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-zinc-600 uppercase block mb-1">Nombre</label>
              <input value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none focus:border-blue-800" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-zinc-600 uppercase block mb-1">País</label>
              <select value={newTeam.country} onChange={e => setNewTeam({...newTeam, country: e.target.value})}
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none">
                <option value="">—</option>
                {countries.map(c => <option key={c.country_id} value={c.country_id}>{c.country_id} - {c.country_name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleCreateTeam} disabled={creatingTeam || !newTeam.id.trim() || !newTeam.name.trim()}
                className="w-full px-3 py-1.5 text-[10px] font-mono rounded font-bold bg-blue-600 text-white hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors">
                {creatingTeam ? 'Creando...' : 'Crear equipo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config del Torneo */}
      {tourney && (
        <div className="mb-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Torneo</span>
            {tourney.exists
              ? <span className="text-[9px] font-mono bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded">ya existe</span>
              : <span className="text-[9px] font-mono bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded">se creará</span>
            }
            <span className="text-[10px] font-mono text-zinc-600 ml-auto">ID: <span className="text-zinc-300">{tourney.generatedId || '⚠ vacío'}</span></span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'Nombre', field: 'tournament_name', val: tourney.tournament_name },
              { label: 'País', field: 'tournament_country_id', val: tourney.tournament_country_id, select: countries.map(c => ({ v: c.country_id, l: `${c.country_id} - ${c.country_name}` })) },
              { label: 'Tier', field: 'tournament_tier', val: String(tourney.tournament_tier ?? '') },
              { label: 'Edición', field: 'tournament_edition', val: tourney.tournament_edition },
              { label: 'Año', field: 'tournament_year', val: tourney.tournament_year },
            ].map(({ label, field, val, select }) => (
              <div key={field}>
                <label className="text-[9px] font-mono text-zinc-600 uppercase block mb-1">
                  {label} {field === 'tournament_edition' && <span className="text-red-500">*</span>}
                </label>
                {select ? (
                  <select value={val} onChange={e => updateTourney(field, e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none">
                    <option value="">—</option>
                    {select.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input value={val} onChange={e => updateTourney(field, field === 'tournament_tier' ? (parseInt(e.target.value) || null) : e.target.value)}
                    className={`w-full bg-black border rounded px-2 py-1.5 text-[10px] font-mono text-zinc-200 outline-none transition-colors ${
                      field === 'tournament_edition' && !val 
                        ? 'border-red-900 focus:border-red-600' 
                        : 'border-zinc-800 focus:border-zinc-600'
                    }`} 
                    placeholder={field === 'tournament_edition' ? 'Obligatorio...' : ''}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de partidos */}
      {mapped.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-zinc-500 text-[10px] font-mono">
              {mapped.length} partidos · {goals.length} goles
              {incompleteCount > 0
                ? <span className="text-amber-400 ml-2">⚠ {incompleteCount} sin team_id</span>
                : <span className="text-emerald-400 ml-2">✓ completos</span>}
            </span>
            <button onClick={handleImport} disabled={uploading || !allComplete}
              className={`px-4 py-1.5 text-[10px] font-mono rounded font-bold transition-colors ${
                !allComplete ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : uploading ? 'bg-zinc-700 text-zinc-500 cursor-wait'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}>
              {uploading ? 'Importando...' : `Importar todo`}
            </button>
          </div>

          <table className="w-full border-collapse text-[10px] font-mono bg-black text-zinc-400 min-w-max">
            <thead>
              <tr className="bg-neutral-950 sticky top-0">
                {['round','match_id','home_id','home','score','away','away_id','stadium','notes','goles'].map(h =>
                  <th key={h} className="border border-zinc-800 p-2 text-[10px] text-zinc-100 uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {mapped.map((row, i) => {
                const hOk = row.home_id !== '', aOk = row.away_id !== ''
                const rowGoals = goals.filter(g => g.match_id === row.match_id)
                return (
                  <tr key={i} className={`transition-colors ${hOk && aOk ? 'hover:bg-zinc-900' : 'bg-red-950/20'}`}>
                    <td className="border border-zinc-800 p-2 whitespace-nowrap text-zinc-300">{row.match_round}</td>
                    <td className={`border border-zinc-800 p-2 whitespace-nowrap ${row.match_id ? 'text-zinc-600' : 'text-amber-500'}`}>
                      {row.match_id || '⚠ pendiente'}
                    </td>
                    <td className="border border-zinc-800 p-0">
                      <div className="flex items-center">
                        <select value={row.home_id} onChange={e => handleTeamChange(i, 'home', e.target.value)}
                          className={`bg-transparent flex-1 p-2 outline-none text-[10px] font-mono cursor-pointer ${hOk ? 'text-emerald-400' : 'text-red-400 bg-red-950/30'}`}>
                          <option value="">— sin asignar —</option>
                          {teams.map(te => <option key={te.team_id} value={te.team_id}>{te.team_id} {te.team_name || ''}</option>)}
                        </select>
                        {!hOk && <button onClick={() => openNewTeam(row.home_name)} className="px-1.5 text-blue-500 hover:text-blue-400 text-sm font-bold" title={`Crear "${row.home_name}"`}>+</button>}
                      </div>
                    </td>
                    <td className={`border border-zinc-800 p-2 whitespace-nowrap font-bold ${hOk ? 'text-zinc-100' : 'text-red-300'}`}>{row.home_name}</td>
                    <td className="border border-zinc-800 p-2 text-center text-zinc-100 font-bold whitespace-nowrap">
                      {row.home_score ?? '-'} - {row.away_score ?? '-'}
                      {(row.home_penalty !== null || row.away_penalty !== null) && (
                        <div className="text-[8px] text-amber-500 font-normal mt-0.5">
                          ({row.home_penalty ?? '?'}-{row.away_penalty ?? '?'})
                        </div>
                      )}
                    </td>
                    <td className={`border border-zinc-800 p-2 whitespace-nowrap font-bold ${aOk ? 'text-zinc-100' : 'text-red-300'}`}>{row.away_name}</td>
                    <td className="border border-zinc-800 p-0">
                      <div className="flex items-center">
                        <select value={row.away_id} onChange={e => handleTeamChange(i, 'away', e.target.value)}
                          className={`bg-transparent flex-1 p-2 outline-none text-[10px] font-mono cursor-pointer ${aOk ? 'text-emerald-400' : 'text-red-400 bg-red-950/30'}`}>
                          <option value="">— sin asignar —</option>
                          {teams.map(te => <option key={te.team_id} value={te.team_id}>{te.team_id} {te.team_name || ''}</option>)}
                        </select>
                        {!aOk && <button onClick={() => openNewTeam(row.away_name)} className="px-1.5 text-blue-500 hover:text-blue-400 text-sm font-bold" title={`Crear "${row.away_name}"`}>+</button>}
                      </div>
                    </td>
                    <td className="border border-zinc-800 p-2 whitespace-nowrap text-zinc-500">{row.stadium_name || '—'}</td>
                    <td className="border border-zinc-800 p-2 text-zinc-500 max-w-[150px] truncate" title={row.match_notes || ''}>{row.match_notes || '—'}</td>
                    <td className="border border-zinc-800 p-2 text-zinc-500 whitespace-nowrap">
                      {rowGoals.length > 0
                        ? rowGoals.map(g => `${g.goal_minute}' ${g.player_name}`).join(', ')
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
