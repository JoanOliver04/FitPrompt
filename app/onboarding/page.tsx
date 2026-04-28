'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OnboardingData {
  name: string
  age: string
  weight: string
  height: string
  gender: string
  goal: string
  level: string
  daysPerWeek: string
  sessionTime: string
  workoutType: string
  schedule: string
  injuries: string
  allergies: string
  foodPreferences: string[]
  extraInfo: string
}

const STEPS = ['Datos básicos', 'Objetivo', 'Entrenamiento', 'Salud', 'Extra']

const initialData: OnboardingData = {
  name: '',
  age: '',
  weight: '',
  height: '',
  gender: '',
  goal: '',
  level: '',
  daysPerWeek: '4',
  sessionTime: '',
  workoutType: '',
  schedule: '',
  injuries: '',
  allergies: '',
  foodPreferences: [],
  extraInfo: '',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(initialData)

  const set = (field: keyof OnboardingData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }))

  const toggleFoodPref = (pref: string) =>
    setData((prev) => ({
      ...prev,
      foodPreferences: prev.foodPreferences.includes(pref)
        ? prev.foodPreferences.filter((p) => p !== pref)
        : [...prev.foodPreferences, pref],
    }))

  const isLastStep = step === STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      router.push('/dashboard')
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#101010] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-8 h-8 bg-[#FF471A] rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold text-xl">FitPrompt</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-[#FF471A]' : 'bg-[#2a2a2a]'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors hidden md:block ${
                  i === step ? 'text-[#FF471A]' : i < step ? 'text-[#E0E0E0]' : 'text-[#666]'
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 animate-slide-up">
          {/* Step 1 — Basic data */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Cuéntanos sobre ti</h2>
                <p className="text-[#E0E0E0] text-sm">Empecemos con tus datos básicos</p>
              </div>
              {[
                { id: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Tu nombre' },
                { id: 'age', label: 'Edad', type: 'number', placeholder: '25' },
                { id: 'weight', label: 'Peso actual (kg)', type: 'number', placeholder: '75' },
                { id: 'height', label: 'Altura (cm)', type: 'number', placeholder: '178' },
              ].map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={data[field.id as keyof OnboardingData] as string}
                    onChange={(e) => set(field.id as keyof OnboardingData, e.target.value)}
                    className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
                  Género
                </label>
                <div className="flex gap-3">
                  {['Hombre', 'Mujer', 'Prefiero no decirlo'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set('gender', g)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        data.gender === g
                          ? 'bg-[#FF471A1A] border-[#FF471A] text-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] text-[#E0E0E0] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Goal & level */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">¿Cuál es tu objetivo?</h2>
                <p className="text-[#E0E0E0] text-sm">Define tu meta para personalizar tu plan</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Objetivo principal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'volumen', icon: '💪', label: 'Ganar músculo' },
                    { value: 'definicion', icon: '🔥', label: 'Perder grasa' },
                    { value: 'mantenimiento', icon: '⚖️', label: 'Mantenimiento' },
                    { value: 'perderpeso', icon: '📉', label: 'Perder peso' },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => set('goal', goal.value)}
                      className={`p-4 rounded-xl text-left transition-all border ${
                        data.goal === goal.value
                          ? 'bg-[#FF471A1A] border-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] hover:border-[#3a3a3a]'
                      }`}
                    >
                      <div className="text-2xl mb-1">{goal.icon}</div>
                      <div className={`text-sm font-semibold ${data.goal === goal.value ? 'text-[#FF471A]' : 'text-white'}`}>
                        {goal.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Nivel de experiencia
                </label>
                <div className="flex gap-3">
                  {['Principiante', 'Intermedio', 'Avanzado'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => set('level', lvl)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                        data.level === lvl
                          ? 'bg-[#FF471A1A] border-[#FF471A] text-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] text-[#E0E0E0] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Días de entrenamiento por semana: <span className="text-[#FF471A]">{data.daysPerWeek}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={data.daysPerWeek}
                  onChange={(e) => set('daysPerWeek', e.target.value)}
                  className="w-full accent-[#FF471A]"
                />
                <div className="flex justify-between text-xs text-[#666] mt-1">
                  <span>1 día</span>
                  <span>7 días</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Tiempo por sesión
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['< 30 min', '30–45 min', '45–60 min', '+ 60 min'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set('sessionTime', t)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        data.sessionTime === t
                          ? 'bg-[#FF471A1A] border-[#FF471A] text-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] text-[#E0E0E0] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Workout type */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Tipo de entrenamiento</h2>
                <p className="text-[#E0E0E0] text-sm">¿Dónde y cuándo prefieres entrenar?</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Tipo de rutina
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'gym', icon: '🏋️', label: 'Gimnasio', desc: 'Con máquinas y pesas' },
                    { value: 'home', icon: '🏠', label: 'Casa', desc: 'Con poco material' },
                    { value: 'bodyweight', icon: '🤸', label: 'Peso corporal', desc: 'Sin material' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => set('workoutType', type.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border ${
                        data.workoutType === type.value
                          ? 'bg-[#FF471A1A] border-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] hover:border-[#3a3a3a]'
                      }`}
                    >
                      <span className="text-3xl">{type.icon}</span>
                      <div>
                        <div className={`font-semibold ${data.workoutType === type.value ? 'text-[#FF471A]' : 'text-white'}`}>
                          {type.label}
                        </div>
                        <div className="text-[#666] text-xs">{type.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Horario preferido
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Mañana 🌅', 'Mediodía ☀️', 'Tarde 🌇', 'Noche 🌙'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('schedule', s)}
                      className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                        data.schedule === s
                          ? 'bg-[#FF471A1A] border-[#FF471A] text-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] text-[#E0E0E0] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Health */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Salud y restricciones</h2>
                <p className="text-[#E0E0E0] text-sm">Para adaptar el plan a tus necesidades</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
                  Lesiones o limitaciones físicas <span className="text-[#666] normal-case">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: rodilla derecha, lumbalgia…"
                  value={data.injuries}
                  onChange={(e) => set('injuries', e.target.value)}
                  className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-2">
                  Alergias o intolerancias <span className="text-[#666] normal-case">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: lactosa, gluten, frutos secos…"
                  value={data.allergies}
                  onChange={(e) => set('allergies', e.target.value)}
                  className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#E0E0E0] uppercase tracking-wide mb-3">
                  Preferencias alimentarias
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Omnívoro', 'Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa'].map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => toggleFoodPref(pref)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        data.foodPreferences.includes(pref)
                          ? 'bg-[#FF471A1A] border-[#FF471A] text-[#FF471A]'
                          : 'bg-[#242424] border-[#2a2a2a] text-[#E0E0E0] hover:border-[#3a3a3a]'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Extra */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">¿Algo más que debamos saber?</h2>
                <p className="text-[#E0E0E0] text-sm">
                  Medicación, condición médica, contexto personal… Todo ayuda a personalizar mejor tu plan.
                </p>
              </div>
              <textarea
                rows={6}
                placeholder="Ej: Tomo medicación para la tensión, hace 6 meses tuve una operación de menisco…"
                value={data.extraInfo}
                onChange={(e) => set('extraInfo', e.target.value)}
                className="w-full bg-[#242424] border border-[#2a2a2a] focus:border-[#FF471A] text-white placeholder-[#555] rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
              />
              <div className="bg-[#FF471A1A] border border-[#FF471A33] rounded-xl p-4 text-sm text-[#E0E0E0]">
                <p className="font-semibold text-white mb-1">¡Todo listo!</p>
                <p>
                  Con estos datos, FitPrompt generará tu rutina y dieta personalizadas al instante.
                  Podrás ajustarlas en cualquier momento desde el chat.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 bg-[#242424] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-[#E0E0E0] py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                ← Atrás
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              {isLastStep ? '🚀 Generar mi plan' : 'Siguiente →'}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <p className="text-center text-[#666] text-xs mt-4">
          Paso {step + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  )
}
