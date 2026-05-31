'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Section = 'personal' | 'physical' | 'training' | 'health'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

interface ProfileData {
  name:            string
  username:        string
  birthDate:       string | null   // ISO date string "YYYY-MM-DD"
  weight:          number | null
  height:          number | null
  goal:            string | null
  level:           string | null
  daysPerWeek:     number | null
  sessionTime:     string | null
  workoutType:     string | null
  schedule:        string | null
  injuries:        string
  allergies:       string
  foodPreferences: string[]
  extraInfo:       string
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

    // Only send fields that actually changed for this section to avoid
    // accidentally re-asserting (and re-validating) untouched values.
    const payload: Partial<ProfileData> = {}
    if (editing === 'personal') {
      if (form.name !== data.name) payload.name = form.name
      if (form.username !== data.username) {
        if (!USERNAME_RE.test(form.username)) {
          setError('Usuario inválido: 3-20 caracteres, minúsculas, números y _')
          return
        }
        payload.username = form.username
      }
      if (form.birthDate !== data.birthDate && form.birthDate) {
        payload.birthDate = form.birthDate
      }
    } else if (editing === 'physical') {
      if (form.weight !== data.weight) payload.weight = form.weight
      if (form.height !== data.height) payload.height = form.height
      if (form.goal   !== data.goal)   payload.goal   = form.goal
    } else if (editing === 'training') {
      if (form.level       !== data.level)       payload.level       = form.level
      if (form.daysPerWeek !== data.daysPerWeek) payload.daysPerWeek = form.daysPerWeek
      if (form.sessionTime !== data.sessionTime) payload.sessionTime = form.sessionTime
      if (form.workoutType !== data.workoutType) payload.workoutType = form.workoutType
      if (form.schedule    !== data.schedule)    payload.schedule    = form.schedule
    } else if (editing === 'health') {
      if (form.injuries  !== data.injuries)  payload.injuries  = form.injuries
      if (form.allergies !== data.allergies) payload.allergies = form.allergies
      if (form.extraInfo !== data.extraInfo) payload.extraInfo = form.extraInfo
      // Array comparison: only send if the list changed
      const oldPrefs = JSON.stringify(data.foodPreferences ?? [])
      const newPrefs = JSON.stringify(form.foodPreferences ?? [])
      if (oldPrefs !== newPrefs) payload.foodPreferences = form.foodPreferences
    }

    if (Object.keys(payload).length === 0) {
      setEditing(null)
      return
    }

    const res = await fetch('/api/user/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { error?: string; issues?: { path: (string | number)[]; message: string }[] }
        | null
      const firstIssue = body?.issues?.[0]
      setError(firstIssue?.message ?? body?.error ?? 'Error al guardar. Inténtalo de nuevo.')
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
                {editing === 'health'    && 'Salud y restricciones'}
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
                  <Field label="Nombre de usuario">
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="ivan_07"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                      className={inputCls}
                    />
                    <p className="text-text-muted text-[11px] mt-1">3-20 caracteres, solo minúsculas, números y _</p>
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
                  <Field label="Duración por sesión">
                    <select
                      value={form.sessionTime ?? ''}
                      onChange={(e) => setForm({ ...form, sessionTime: e.target.value })}
                      className={inputCls}
                    >
                      <option value="<30">Menos de 30 min</option>
                      <option value="30-45">30 – 45 min</option>
                      <option value="45-60">45 – 60 min</option>
                      <option value=">60">Más de 60 min</option>
                    </select>
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
                  <Field label="Horario preferido">
                    <select
                      value={form.schedule ?? ''}
                      onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                      className={inputCls}
                    >
                      <option value="morning">Mañana</option>
                      <option value="midday">Mediodía</option>
                      <option value="afternoon">Tarde</option>
                      <option value="night">Noche</option>
                    </select>
                  </Field>
                </>
              )}

              {editing === 'health' && (
                <>
                  <Field label="Lesiones o limitaciones">
                    <textarea
                      rows={2}
                      placeholder="Ej: dolor lumbar al peso muerto, rodilla derecha sensible…"
                      value={form.injuries}
                      onChange={(e) => setForm({ ...form, injuries: e.target.value })}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                  <Field label="Alergias o intolerancias">
                    <textarea
                      rows={2}
                      placeholder="Ej: lactosa, frutos secos…"
                      value={form.allergies}
                      onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                  <Field label="Preferencias alimentarias (separadas por coma)">
                    <input
                      type="text"
                      placeholder="vegetariano, sin gluten, mediterráneo…"
                      value={form.foodPreferences.join(', ')}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          foodPreferences: e.target.value
                            .split(',')
                            .map((p) => p.trim())
                            .filter((p) => p.length > 0)
                            .slice(0, 20),
                        })
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Información adicional">
                    <textarea
                      rows={3}
                      placeholder="Cualquier otra cosa que el coach IA deba saber…"
                      value={form.extraInfo}
                      onChange={(e) => setForm({ ...form, extraInfo: e.target.value })}
                      className={`${inputCls} resize-none`}
                    />
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
