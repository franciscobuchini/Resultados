import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../functions/supabase'
import Papa from 'papaparse'

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
  tournament_edition: string; tournament_season: string[]
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
  goal_minute: number | null; player_name: string; goal_type: string
}

interface ImportEntry {
  id: string // internal uuid for keying
  fileName: string
  tourney: TournamentConfig
  mapped: MappedMatch[]
  goals: GoalRow[]
  expanded: boolean
}

// ── Helpers de Normalización ───────────────────────────
function normalizeRawData(data: Record<string, unknown>[]): RawMatch[] {
  return data.map(item => ({
    Fecha: String(item.Fecha || ''),
    Lugar: String(item.Lugar || ''),
    Equipo1: String(item.Equipo1 || ''),
    Goles1: Number(item.Goles1 ?? 0),
    Goleadores1: String(item.Goleadores1 || ''),
    Equipo2: String(item.Equipo2 || ''),
    Goles2: Number(item.Goles2 ?? 0),
    Goleadores2: String(item.Goleadores2 || ''),
    Notas: String(item.Notas || ''),
    N_Fecha: String(item.N_Fecha || ''),
    Estadio: String(item.Estadio || ''),
    Estadio_Wikiname: String(item.Estadio_Wikiname || ''),
    Pais: Array.isArray(item.Pais) ? item.Pais : [String(item.Pais || '')].filter(Boolean),
    Temporada: Array.isArray(item.Temporada) ? item.Temporada : [String(item.Temporada || '')].filter(Boolean),
    Categoria: Array.isArray(item.Categoria) ? item.Categoria : [String(item.Categoria || '')].filter(Boolean),
    Torneo: Array.isArray(item.Torneo) ? item.Torneo : [String(item.Torneo || '')].filter(Boolean),
    Subdivision: Array.isArray(item.Subdivision) ? item.Subdivision : [String(item.Subdivision || '')].filter(Boolean),
  }))
}

function parseDate(f: string): string {
  const [dd, mm, yyyy] = f.split('/');
  return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

function t(s: string) { return s?.trim() || '' }

function parseTier(cat: string): number | null {
  const m = cat.match(/(\d+)/); return m ? parseInt(m[1]) : null
}

function genTournamentId(cid: string, tier: number | null, ed: string, season: string[]) {
  const sStr = season.join('-')
  return `${t(cid)}.${tier ?? ''}.${t(ed)}.${sStr}`
}

function expandScorers(str: string): string[] {
  if (!str?.trim()) return []
  const parts = str.split(/[,;\n]|\s[ye]\s/).map(s => s.trim()).filter(Boolean)
  const expanded: string[] = []
  parts.forEach(p => {
    const multiMatch = p.match(/^(.+?)\s+(\d+)(?:\s*\((\d+)p\))?$/)
    if (multiMatch) {
      const name = multiMatch[1].trim()
      const total = parseInt(multiMatch[2])
      const penals = parseInt(multiMatch[3] || '0')
      for(let i=0; i<total; i++) expanded.push(i < penals ? `${name} (p)` : name)
    } else {
      expanded.push(p)
    }
  })
  return expanded
}

function parseGoals(rawList: string[], matchId: string, homeId: string, awayId: string, homeScore: number): GoalRow[] {
  const goals: GoalRow[] = []
  rawList.forEach((raw, i) => {
    const isHome = i < homeScore
    const teamId = isHome ? homeId : awayId
    const side = isHome ? 'H' : 'A'
    let minute: number | null = null
    let player = raw.trim()
    const minMatch = player.match(/^(\d+)(?:\+(\d+))?[''´']\s*(.+)$/)
    if (minMatch) {
      minute = parseInt(minMatch[1]) + (minMatch[2] ? parseInt(minMatch[2]) : 0)
      player = minMatch[3].trim()
    } else if (player.startsWith("null'")) {
      player = player.replace("null'", "").trim()
    }
    let gtype = 'G'
    if (/\b(p|penal|pen)\b/i.test(player)) {
      gtype = 'P'
      player = player.replace(/\(?(p|penal|pen)\)?/i, '').trim()
    } else if (/\b(e\/?c|autogol)\b/i.test(player)) {
      gtype = 'C'
      player = player.replace(/\(?(e\/?c|autogol)\)?/i, '').trim()
    }
    player = player.replace(/^[y,e\s]+|[y,e\s]+$/g, '').trim()
    if (teamId) {
      goals.push({ 
        goal_id: `${matchId}_${side}${i+1}`, match_id: matchId, team_id: teamId, 
        goal_minute: minute, player_name: player.substring(0, 50), goal_type: gtype 
      })
    }
  })
  return goals
}

function parsePenalties(notes: string, home: string, away: string) {
  if (!notes || !/penal/i.test(notes)) return { hp: null, ap: null }
  const m = notes.match(/(\d+)\s*-\s*(\d+)/)
  if (!m) return { hp: null, ap: null }
  const s1 = parseInt(m[1]), s2 = parseInt(m[2])
  const win = Math.max(s1, s2), los = Math.min(s1, s2)
  const check = (name: string) => {
    const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    return words.some(w => notes.toLowerCase().includes(w))
  }
  if (check(home)) return { hp: win, ap: los }
  if (check(away)) return { hp: los, ap: win }
  return { hp: null, ap: null }
}

export default function FileImporter() {
  const [teams, setTeams] = useState<DbTeam[]>([])
  const [countries, setCountries] = useState<DbCountry[]>([])
  const [existingTournaments, setExistingTournaments] = useState<DbTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<ImportEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ok: boolean; msg: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const STORAGE_KEY = 'importer_team_map'
  const [nameMap, setNameMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
  })

  const saveNameMap = (updated: Record<string, string>) => {
    setNameMap(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const teamByName = useMemo(() => {
    const m = new Map<string, string>()
    for (const te of teams) if (te.team_name) m.set(te.team_name.toLowerCase().trim(), te.team_id)
    for (const [k, v] of Object.entries(nameMap)) m.set(k.toLowerCase().trim(), v)
    return m
  }, [teams, nameMap])

  const resolveTeam = useCallback((name: string): string => {
    return teamByName.get(name.toLowerCase().trim()) || ''
  }, [teamByName])

  const countryByName = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of countries) if (c.country_name) m.set(c.country_name.toLowerCase().trim(), c.country_id)
    return m
  }, [countries])

  const createEntry = useCallback((fileName: string, text: string): ImportEntry | null => {
    const isCsv = fileName.toLowerCase().endsWith('.csv')
    let raw: Record<string, unknown>[] = []
    if (isCsv) {
      const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })
      raw = parsed.data
    } else {
      if (!text.toLowerCase().trim().endsWith('ok')) return null
      raw = JSON.parse(text.trim().slice(0, -2).trim()) as Record<string, unknown>[]
    }
    if (!Array.isArray(raw) || raw.length === 0) return null
    
    const normalized = normalizeRawData(raw)
    const first = normalized[0]
    const countryId = countryByName.get((first.Pais?.[0] || '').toLowerCase().trim()) || 'ARG'
    const tier = parseTier(first.Categoria?.[0] || '')
    const year = first.Temporada?.[0] ? String(first.Temporada[0]).trim() : ''
    const gid = genTournamentId(countryId, tier, "", [year])
    
    const tourney: TournamentConfig = {
      tournament_name: first.Torneo?.[0] || '',
      tournament_tier: tier,
      tournament_edition: "",
      tournament_season: [year],
      tournament_country_id: 'ARG',
      generatedId: gid,
      exists: existingTournaments.some(et => t(et.tournament_id) === gid)
    }

    const allGoals: GoalRow[] = []
    const mapped = normalized.map(r => {
      const matchDate = parseDate(r.Fecha)
      const homeId = resolveTeam(r.Equipo1), awayId = resolveTeam(r.Equipo2)
      const matchId = (homeId && awayId) ? `${matchDate.replace(/-/g, '')}${homeId}${awayId}` : ''
      const penalties = parsePenalties(r.Notas, r.Equipo1, r.Equipo2)
      const match: MappedMatch = {
        match_id: matchId, match_date: matchDate, match_time_utc: '00:00:00',
        match_status: 'Finalizado', game_time: 0, home_id: homeId, home_name: r.Equipo1, home_score: r.Goles1,
        away_id: awayId, away_name: r.Equipo2, away_score: r.Goles2, home_penalty: penalties.hp, away_penalty: penalties.ap,
        tournament_id: gid, match_round: /^\d+$/.test(String(r.N_Fecha || '').trim()) ? `Fecha ${String(r.N_Fecha).trim()}` : (r.N_Fecha || 'Fase Regular'),
        stadium_name: r.Estadio || null, match_notes: r.Notas || null,
      }
      const scorersRaw = (r.Goleadores1 || '') + (r.Goleadores2 ? '; ' + r.Goleadores2 : '')
      if (matchId && scorersRaw) {
        allGoals.push(...parseGoals(expandScorers(scorersRaw), matchId, homeId, awayId, r.Goles1 || 0))
      }
      return match
    })

    return { id: crypto.randomUUID(), fileName, tourney, mapped, goals: allGoals, expanded: false }
  }, [resolveTeam, countryByName, existingTournaments])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const newEntries: ImportEntry[] = []
    for (const file of files) {
      const text = await file.text()
      const entry = createEntry(file.name, text)
      if (entry) newEntries.push(entry)
    }
    setEntries(prev => [...prev, ...newEntries])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateEntryTourney = (id: string, field: string, val: string | number | null) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e
      const u = { ...e.tourney, [field]: val }
      if (field === 'tournament_season' && typeof val === 'string') {
        u.tournament_season = val.split(/[,-]/).map(s => s.trim()).filter(Boolean)
      }
      u.generatedId = genTournamentId(u.tournament_country_id, u.tournament_tier, u.tournament_edition, u.tournament_season)
      u.exists = existingTournaments.some(et => t(et.tournament_id) === u.generatedId)
      return { ...e, tourney: u, mapped: e.mapped.map(m => ({ ...m, tournament_id: u.generatedId })) }
    }))
  }

  const handleTeamChange = (entryId: string, matchIdx: number, side: 'home'|'away', val: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e
      const teamName = side === 'home' ? e.mapped[matchIdx].home_name : e.mapped[matchIdx].away_name
      if (val && teamName) saveNameMap({ ...nameMap, [teamName.toLowerCase().trim()]: val })
      
      const updatedMapped = e.mapped.map((row, i) => {
        const r = { ...row }
        if (i === matchIdx) { if (side === 'home') r.home_id = val; else r.away_id = val }
        else {
          if (r.home_name === teamName && !r.home_id) r.home_id = val
          if (r.away_name === teamName && !r.away_id) r.away_id = val
        }
        r.match_id = (r.home_id && r.away_id) ? `${r.match_date.replace(/-/g,'')}${r.home_id}${r.away_id}` : ''
        return r
      })

      // Sync Goals
      const updatedGoals = e.goals.map(g => {
        const match = updatedMapped.find((_, idx) => {
          const oldId = e.mapped[idx].match_id
          return g.match_id === oldId || (oldId === '' && g.match_id === '')
        })
        if (match && match.match_id !== g.match_id) {
          return { ...g, match_id: match.match_id, team_id: g.goal_id.includes('_H') ? match.home_id : match.away_id,
            goal_id: `${match.match_id}${g.goal_id.substring(g.goal_id.indexOf('_'))}` }
        }
        return g
      })
      return { ...e, mapped: updatedMapped, goals: updatedGoals }
    }))
  }

  const handleGoalsChange = (entryId: string, matchIdx: number, val: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e
      const match = e.mapped[matchIdx]
      if (!match.match_id) return e

      const expanded = expandScorers(val)
      const newGoalsForMatch = parseGoals(expanded, match.match_id, match.home_id, match.away_id, match.home_score || 0)
      
      const otherGoals = e.goals.filter(g => g.match_id !== match.match_id)
      return { ...e, goals: [...otherGoals, ...newGoalsForMatch] }
    }))
  }

  const handleImportEntry = async (entry: ImportEntry) => {
    setUploading(true)
    try {
      if (!entry.tourney.exists) {
        await supabase.from('tournaments').insert({
          tournament_name: entry.tourney.tournament_name, tournament_tier: entry.tourney.tournament_tier,
          tournament_edition: entry.tourney.tournament_edition, tournament_season: entry.tourney.tournament_season,
          tournament_country_id: entry.tourney.tournament_country_id || null,
        })
      }
      await supabase.from('matches').upsert(entry.mapped, { onConflict: 'match_id' })
      if (entry.goals.length > 0) {
        const ids = [...new Set(entry.goals.map(g => g.match_id))]
        await supabase.from('goals').delete().in('match_id', ids)
        await supabase.from('goals').insert(entry.goals)
      }
      setEntries(prev => prev.filter(e => e.id !== entry.id))
      setResult({ ok: true, msg: `✓ Torneo ${entry.tourney.tournament_name} importado.` })
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message })
    } finally { setUploading(false) }
  }

  const handleImportAll = async () => {
    const ready = entries.filter(e => e.tourney.tournament_edition !== '' && e.mapped.every(m => m.match_id !== ''))
    if (ready.length === 0) return
    for (const entry of ready) await handleImportEntry(entry)
  }

  if (loading) return <div className="p-4 text-zinc-600 text-xs font-mono text-center pt-20">Cargando datos...</div>

  return (
    <div className="p-4 max-w-7xl mx-auto">


      {/* Drop Zone */}
      <div onClick={() => fileInputRef.current?.click()}
        className="mb-8 border-2 border-dashed border-zinc-800 bg-zinc-900/20 hover:border-zinc-600 hover:bg-zinc-900/40 rounded-2xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json,.txt,.csv" multiple />
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:scale-110 group-hover:text-white transition-all">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-mono font-bold text-zinc-300">Seleccionar archivos CSV / JSON</p>
          <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">Puedes subir múltiples archivos a la vez</p>
        </div>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-mono border ${result.ok ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400' : 'bg-red-900/20 border-red-800/50 text-red-400'}`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{result.ok ? '✓' : '⚠'}</span>
            {result.msg}
            <button onClick={() => setResult(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Global Actions */}
      {entries.length > 0 && (
        <div className="mb-6 flex items-center justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            {entries.length} archivos cargados en cola
          </div>
          <button onClick={handleImportAll} disabled={uploading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
            Importar Todo ({entries.length})
          </button>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.map(entry => {
          const red = entry.mapped.filter(m => m.home_id==='' || m.away_id==='').length
          const yellow = entry.mapped.filter(m => {
            const score = (m.home_score||0)+(m.away_score||0)
            const goalsCount = entry.goals.filter(g => g.match_id === m.match_id).length
            return score > 0 && goalsCount < score
          }).length
          const ready = entry.tourney.tournament_edition !== '' && red === 0

          return (
            <div key={entry.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Tournament Row (Consolidated) */}
              <div className="p-4 flex flex-wrap items-center gap-6">
                <div className="flex-shrink-0 border-r border-zinc-800/50 pr-6 min-w-[200px]">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-0.5 block">{entry.fileName}</span>
                  <h3 className="text-lg font-mono font-black text-white tracking-tighter leading-none">{entry.tourney.generatedId}</h3>
                </div>

                <div className="flex items-center gap-4 border-r border-zinc-800/50 pr-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-zinc-500 uppercase mb-0.5">Part.</span>
                    <span className="text-xl font-black text-zinc-100 leading-none">{entry.mapped.length}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-zinc-500 uppercase mb-0.5">Goles</span>
                    <span className="text-xl font-black text-zinc-100 leading-none">{entry.goals.length}</span>
                  </div>
                  {red > 0 && (
                    <div className="bg-red-500/20 px-2 py-1 rounded flex flex-col items-center">
                      <span className="text-[7px] font-mono text-red-400 uppercase">Red</span>
                      <span className="text-xs font-black text-red-400 leading-none">{red}</span>
                    </div>
                  )}
                  {yellow > 0 && (
                    <div className="bg-amber-500/20 px-2 py-1 rounded flex flex-col items-center">
                      <span className="text-[7px] font-mono text-amber-400 uppercase">Warn</span>
                      <span className="text-xs font-black text-amber-400 leading-none">{yellow}</span>
                    </div>
                  )}
                  {red === 0 && yellow === 0 && (
                    <div className="bg-emerald-500/20 px-2 py-1 rounded flex flex-col items-center">
                      <span className="text-[7px] font-mono text-emerald-400 uppercase">Status</span>
                      <span className="text-xs font-black text-emerald-400 leading-none">OK</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow flex items-center gap-3">
                  {[
                    { label: 'Nombre', field: 'tournament_name', val: entry.tourney.tournament_name, w: 'flex-[2]' },
                    { label: 'Tier', field: 'tournament_tier', val: String(entry.tourney.tournament_tier ?? ''), w: 'w-8' },
                    { label: 'Edición', field: 'tournament_edition', val: entry.tourney.tournament_edition, w: 'w-16' },
                    { label: 'Temporada', field: 'tournament_season', val: entry.tourney.tournament_season.join(', '), w: 'flex-[1]' },
                  ].map(({ label, field, val, w }) => (
                    <div key={field} className={w}>
                      <label className="text-[7px] font-mono text-zinc-600 uppercase block mb-1">{label}</label>
                      <input value={val} onChange={e => updateEntryTourney(entry.id, field, field==='tournament_tier'? (parseInt(e.target.value)||null):e.target.value)}
                        className={`w-full bg-transparent border-b font-bold text-[10px] text-zinc-300 outline-none pb-0.5 ${field==='tournament_edition'&&!val?'border-red-600':'border-zinc-800'}`} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-zinc-800/50">
                  <button onClick={() => setEntries(prev => prev.map(e => e.id === entry.id ? {...e, expanded: !e.expanded} : e))}
                    className="p-2 text-zinc-500 hover:text-white transition-colors">
                    {entry.expanded ? '▲' : '▼'}
                  </button>
                  <button onClick={() => handleImportEntry(entry)} disabled={!ready || uploading}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${ready ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}>
                    {uploading ? '...' : 'SUBIR'}
                  </button>
                  <button onClick={() => setEntries(prev => prev.filter(e => e.id !== entry.id))} className="text-zinc-700 hover:text-red-400 p-2">✕</button>
                </div>
              </div>

              {/* Collapsible Table */}
              {entry.expanded && (
                <div className="border-t border-zinc-800 p-4 bg-black/40">
                   <div className="border border-zinc-800 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full border-collapse text-[10px] font-mono text-zinc-400">
                      <thead className="bg-zinc-950 sticky top-0">
                        <tr>{['round','id','local','score','visita','goles'].map(h => <th key={h} className="p-3 text-left text-zinc-500 uppercase font-bold">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {entry.mapped.map((row, i) => {
                          const hOk = row.home_id!=='', aOk = row.away_id!==''
                          const rowGoals = entry.goals.filter(g => g.match_id === row.match_id)
                          const score = (row.home_score||0)+(row.away_score||0)
                          const isWarn = score > 0 && rowGoals.length < score
                          return (
                            <tr key={i} className={`group ${!hOk||!aOk?'bg-red-950/20':isWarn?'bg-amber-950/20':'hover:bg-zinc-900/50'}`}>
                              <td className="p-3 text-zinc-500">{row.match_round}</td>
                              <td className="p-3 text-zinc-700">{row.match_id ? row.match_id.substring(row.match_id.length-8) : 'PEND'}</td>
                              <td className="p-3">
                                {!hOk ? (
                                  <select value={row.home_id} onChange={e => handleTeamChange(entry.id, i, 'home', e.target.value)}
                                    className="bg-black text-red-400 border border-red-900/50 rounded text-[10px] outline-none">
                                    <option value="">— {row.home_name} —</option>
                                    {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                                  </select>
                                ) : <span className="text-zinc-100 font-bold">{row.home_name} <span className="text-zinc-600">[{row.home_id}]</span></span>}
                              </td>
                              <td className="p-3 text-center text-zinc-200 font-bold bg-zinc-900/20">{row.home_score} - {row.away_score}</td>
                              <td className="p-3 text-right">
                                {!aOk ? (
                                  <select value={row.away_id} onChange={e => handleTeamChange(entry.id, i, 'away', e.target.value)}
                                    className="bg-black text-red-400 border border-red-900/50 rounded text-[10px] outline-none">
                                    <option value="">— {row.away_name} —</option>
                                    {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                                  </select>
                                ) : <span className="text-zinc-100 font-bold"><span className="text-zinc-600">[{row.away_id}]</span> {row.away_name}</span>}
                              </td>
                              <td className="p-3 text-zinc-500 italic text-[9px]">
                                {isWarn ? (
                                  <input 
                                    value={rowGoals.map(g => g.player_name).join('; ')}
                                    onChange={e => handleGoalsChange(entry.id, i, e.target.value)}
                                    className="w-full bg-amber-500/10 border-b border-amber-500/30 focus:border-amber-500 outline-none text-[9px] text-amber-200 placeholder:text-zinc-800 px-1 py-0.5 rounded"
                                    placeholder="Corregir goleadores..."
                                  />
                                ) : (
                                  rowGoals.map(g => g.player_name).join(', ') || '—'
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
