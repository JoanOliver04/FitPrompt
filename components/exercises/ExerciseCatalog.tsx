'use client'

import { useState, useMemo } from 'react'
import type { Exercise, Equipment } from '@/types'
import { MUSCLE_LABELS, TYPE_LABELS, EQUIPMENT_LABELS } from '@/lib/exercises'
import ExerciseCard from './ExerciseCard'

interface Props {
  exercises: Exercise[]
}

export default function ExerciseCatalog({ exercises }: Props) {
  const [search, setSearch]       = useState('')
  const [muscleGroup, setMuscle]  = useState('')
  const [type, setType]           = useState('')
  const [equipment, setEquipment] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q)) return false
      if (muscleGroup && ex.muscleGroup !== muscleGroup) return false
      if (type && ex.type !== type) return false
      if (equipment && !ex.equipment.includes(equipment as Equipment)) return false
      return true
    })
  }, [exercises, search, muscleGroup, type, equipment])

  const hasFilters = search || muscleGroup || type || equipment

  return (
    <div>
      {/* Search */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-text-muted">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#FF471A55] focus:ring-1 focus:ring-[#FF471A22] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text-primary transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        <FilterRow
          label="Músculo"
          options={[['', 'Todos'], ...Object.entries(MUSCLE_LABELS)]}
          value={muscleGroup}
          onChange={setMuscle}
        />
        <FilterRow
          label="Tipo"
          options={[['', 'Todos'], ...Object.entries(TYPE_LABELS)]}
          value={type}
          onChange={setType}
        />
        <FilterRow
          label="Equipo"
          options={[['', 'Todos'], ...Object.entries(EQUIPMENT_LABELS)]}
          value={equipment}
          onChange={setEquipment}
        />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-muted">
          <span className="text-text-secondary font-semibold">{filtered.length}</span>
          {' '}ejercicio{filtered.length !== 1 ? 's' : ''}
          {hasFilters ? ' encontrado' : ' en total'}
          {filtered.length !== 1 ? 's' : ''}
        </p>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setMuscle(''); setType(''); setEquipment('') }}
            className="text-xs text-text-muted hover:text-[#FF471A] transition-colors underline underline-offset-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exercise, i) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              style={{ animationDelay: `${i * 35}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold text-text-secondary">Sin resultados</p>
          <p className="text-sm text-text-muted mt-1">Prueba con otros filtros o busca otro nombre</p>
        </div>
      )}
    </div>
  )
}

// ─── FilterRow ─────────────────────────────────────────────────────────────────

interface FilterRowProps {
  label: string
  options: [string, string][]
  value: string
  onChange: (v: string) => void
}

function FilterRow({ label, options, value, onChange }: FilterRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-text-muted font-medium shrink-0 w-14 text-right">{label}</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5 flex-1">
        {options.map(([key, text]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={[
              'shrink-0 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all duration-150',
              value === key
                ? 'bg-[#FF471A] border-[#FF471A] text-white'
                : 'bg-bg-secondary border-border-default text-text-muted hover:border-[#FF471A44] hover:text-text-secondary',
            ].join(' ')}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
