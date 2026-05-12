'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Section = 'personal' | 'physical' | 'training'

interface ProfileData {
  name:         string
  birthDate:    string | null   // ISO date string "YYYY-MM-DD"
  weight:       number | null
  height:       number | null
  goal:         string | null
  level:        string | null
  daysPerWeek:  number | null
  workoutType:  string | null
}

interface Props {
  data:           ProfileData
  profileSections: { title: string; editSection: Section; items: { label: string; value: string }[] }[]
}

export default function ProfileSections({ data, profileSections }: Props) {
  const router = useRouter()
  const [editing, setEditing]     = useState<Section | null>(null)
  const [form, setForm]           = useState(data)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openEdit(section: Section) {
    setForm(data)
    setError(null)
    setEditing(section)
  }

  async function save() {
    setError(null)
    const res = await fetch('/api/user/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    if (!res.ok) {
      setError('Error al guardar. Inténtalo de nuevo.')
      return
    }
    setEditing(null)
    startTransition(() => router.refresh())
  }

  return (
    <>
      <div className="space-y-4">
        {profileSections.map((section) => (
          <div key={section.title} className="bg-bg-secondary border border-border-default rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-text-primary font-bold">{section.title}</h3>
              <button
                type="button"
                onClick={() => openEdit(section.editSection)}
                className="text-[#FF471A] text-xs font-semibold hover:underline"
              >
                Editar
              </button>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                  <span className="text-text-muted text-sm">{item.label}</span>
                  <span className="text-text-primary text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null) }}
        >
          <div className="bg-bg-secondary border border-border-default rounded-2xl w-full max-w-md p-6 animate-enter">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-text-primary font-bold text-lg">
                {editing === 'personal'  && 'Datos personales'}
                {editing === 'physical'  && 'Datos físicos'}
                {editing === 'training'  && 'Preferencias de entrenamiento'}
              </h3>
              <button onClick={() => setEditing(null)} className="text-text-muted hover:text-text-primary text-xl leading-none transition-colors">×</button>
            </div>

            <div className="space-y-4">
              {editing === 'personal' && (
                <>
                  <Field label="Nombre">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Fecha de nacimiento">
                    <input
                      type="date"
                      value={form.birthDate ?? ''}
                      onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              {editing === 'physical' && (
                <>
                  <Field label="Peso (kg)">
                    <input
                      type="number" min="30" max="300" step="0.1"
                      value={form.weight ?? ''}
                      onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Altura (cm)">
                    <input
                      type="number" min="100" max="250"
                      value={form.height ?? ''}
                      onChange={(e) => setForm({ ...form, height: parseFloat(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Objetivo">
                    <select
                      value={form.goal ?? ''}
                      onChange={(e) => setForm({ ...form, goal: e.target.value })}
                      className={inputCls}
                    >
                      <option value="volume">Volumen</option>
                      <option value="definition">Definición</option>
                      <option value="maintenance">Mantenimiento</option>
                      <option value="weight_loss">Pérdida de peso</option>
                    </select>
                  </Field>
                </>
              )}

              {editing === 'training' && (
                <>
                  <Field label="Nivel">
                    <select
                      value={form.level ?? ''}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                      className={inputCls}
                    >
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </Field>
                  <Field label="Días por semana">
                    <input
                      type="number" min="1" max="7"
                      value={form.daysPerWeek ?? ''}
                      onChange={(e) => setForm({ ...form, daysPerWeek: parseInt(e.target.value) })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Tipo de entrenamiento">
                    <select
                      value={form.workoutType ?? ''}
                      onChange={(e) => setForm({ ...form, workoutType: e.target.value })}
                      className={inputCls}
                    >
                      <option value="gym">Gimnasio</option>
                      <option value="home">Casa</option>
                      <option value="bodyweight">Peso corporal</option>
                    </select>
                  </Field>
                </>
              )}
            </div>

            {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-xl border border-border-default text-text-secondary text-sm font-medium hover:bg-bg-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#FF471A] hover:bg-[#E03D16] disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const inputCls = 'w-full bg-bg-primary border border-border-default rounded-xl px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-[#FF471A] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-text-muted text-xs font-medium mb-1.5">{label}</label>
      {children}
    </div>
  )
}
