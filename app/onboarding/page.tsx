'use client'

import { useOnboarding, STEPS, maxBirthDate, minBirthDate } from '@/hooks/useOnboarding'
import Logo from '@/components/ui/Logo'

export default function OnboardingPage() {
  const { step, data, errors, isSubmitting, isHydrated, set, setPublic, toggleFoodPref, goNext, goBack } =
    useOnboarding()

  const isLastStep = step === STEPS.length - 1

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF471A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Logo height={48} />
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-[#FF471A]' : 'bg-border-default'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors hidden md:block ${
                  i === step ? 'text-[#FF471A]' : i < step ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-8 animate-slide-up">

          {/* ── Step 0: Basic data ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-text-primary mb-1">Cuéntanos sobre ti</h2>
                <p className="text-text-secondary text-sm">Empecemos con tus datos básicos</p>
              </div>

              {(
                [
                  { id: 'name',   label: 'Nombre completo',    type: 'text',   placeholder: 'Tu nombre' },
                  { id: 'weight', label: 'Peso actual (kg)',    type: 'number', placeholder: '75' },
                  { id: 'height', label: 'Altura (cm)',         type: 'number', placeholder: '178' },
                ] as const
              ).map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={data[field.id]}
                    onChange={(e) => set(field.id, e.target.value)}
                    className={`w-full bg-bg-tertiary border text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-[#FF471A] ${
                      errors[field.id] ? 'border-red-500' : 'border-border-default'
                    }`}
                  />
                  {errors[field.id] && (
                    <p className="text-red-400 text-xs mt-1">{errors[field.id]}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  min={minBirthDate()}
                  max={maxBirthDate()}
                  value={data.birthDate}
                  onChange={(e) => set('birthDate', e.target.value)}
                  className={`w-full bg-bg-tertiary border text-text-primary rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-[#FF471A] [color-scheme:dark] ${
                    errors.birthDate ? 'border-red-500' : 'border-border-default'
                  }`}
                />
                {errors.birthDate && (
                  <p className="text-red-400 text-xs mt-1">{errors.birthDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
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
                          : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-subtle'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && (
                  <p className="text-red-400 text-xs mt-1">{errors.gender}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Goal & level ───────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary mb-1">¿Cuál es tu objetivo?</h2>
                <p className="text-text-secondary text-sm">Define tu meta para personalizar tu plan</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Objetivo principal
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'volumen',     icon: '💪', label: 'Ganar músculo' },
                    { value: 'definicion',  icon: '🔥', label: 'Perder grasa' },
                    { value: 'mantenimiento', icon: '⚖️', label: 'Mantenimiento' },
                    { value: 'perderpeso',  icon: '📉', label: 'Perder peso' },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => set('goal', goal.value)}
                      className={`p-4 rounded-xl text-left transition-all border ${
                        data.goal === goal.value
                          ? 'bg-[#FF471A1A] border-[#FF471A]'
                          : 'bg-bg-tertiary border-border-default hover:border-text-subtle'
                      }`}
                    >
                      <div className="text-2xl mb-1">{goal.icon}</div>
                      <div className={`text-sm font-semibold ${data.goal === goal.value ? 'text-[#FF471A]' : 'text-text-primary'}`}>
                        {goal.label}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.goal && <p className="text-red-400 text-xs mt-2">{errors.goal}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
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
                          : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-subtle'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                {errors.level && <p className="text-red-400 text-xs mt-1">{errors.level}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Días de entrenamiento por semana:{' '}
                  <span className="text-[#FF471A]">{data.daysPerWeek}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={data.daysPerWeek}
                  onChange={(e) => set('daysPerWeek', e.target.value)}
                  className="w-full accent-[#FF471A]"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>1 día</span>
                  <span>7 días</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
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
                          : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-subtle'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {errors.sessionTime && (
                  <p className="text-red-400 text-xs mt-1">{errors.sessionTime}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Workout type ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-text-primary mb-1">Tipo de entrenamiento</h2>
                <p className="text-text-secondary text-sm">¿Dónde y cuándo prefieres entrenar?</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  Tipo de rutina
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'gym',        icon: '🏋️', label: 'Gimnasio',      desc: 'Con máquinas y pesas' },
                    { value: 'home',       icon: '🏠', label: 'Casa',           desc: 'Con poco material' },
                    { value: 'bodyweight', icon: '🤸', label: 'Peso corporal',  desc: 'Sin material' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => set('workoutType', type.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border ${
                        data.workoutType === type.value
                          ? 'bg-[#FF471A1A] border-[#FF471A]'
                          : 'bg-bg-tertiary border-border-default hover:border-text-subtle'
                      }`}
                    >
                      <span className="text-3xl">{type.icon}</span>
                      <div>
                        <div className={`font-semibold ${data.workoutType === type.value ? 'text-[#FF471A]' : 'text-text-primary'}`}>
                          {type.label}
                        </div>
                        <div className="text-text-muted text-xs">{type.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.workoutType && (
                  <p className="text-red-400 text-xs mt-1">{errors.workoutType}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
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
                          : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-subtle'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.schedule && (
                  <p className="text-red-400 text-xs mt-1">{errors.schedule}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Health ─────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-text-primary mb-1">Salud y restricciones</h2>
                <p className="text-text-secondary text-sm">Para adaptar el plan a tus necesidades</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Lesiones o limitaciones físicas{' '}
                  <span className="text-text-muted normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej: rodilla derecha, lumbalgia…"
                  value={data.injuries}
                  onChange={(e) => set('injuries', e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                  Alergias o intolerancias{' '}
                  <span className="text-text-muted normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: lactosa, gluten, frutos secos…"
                  value={data.allergies}
                  onChange={(e) => set('allergies', e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
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
                          : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-subtle'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Extra ──────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-text-primary mb-1">
                  ¿Algo más que debamos saber?
                </h2>
                <p className="text-text-secondary text-sm">
                  Medicación, condición médica, contexto personal… Todo ayuda a personalizar mejor tu plan.
                </p>
              </div>

              <textarea
                rows={6}
                placeholder="Ej: Tomo medicación para la tensión, hace 6 meses tuve una operación de menisco…"
                value={data.extraInfo}
                onChange={(e) => set('extraInfo', e.target.value)}
                className="w-full bg-bg-tertiary border border-border-default focus:border-[#FF471A] text-text-primary placeholder-text-muted rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
              />

              {/* Privacy toggle */}
              <div className="bg-bg-tertiary border border-border-default rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm mb-0.5">
                      {data.isPublic ? '🔓 Cuenta pública' : '🔒 Cuenta privada'}
                    </p>
                    <p className="text-text-muted text-xs leading-relaxed">
                      {data.isPublic
                        ? 'Cualquiera puede seguirte directamente. Puedes cambiarlo en cualquier momento desde Configuración.'
                        : 'Los nuevos seguidores deben enviar una solicitud que tú aceptas o rechazas.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={data.isPublic}
                    onClick={() => setPublic(!data.isPublic)}
                    className={[
                      'relative p-0 w-11 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5',
                      data.isPublic ? 'bg-[#FF471A]' : 'bg-bg-secondary border border-border-default',
                    ].join(' ')}
                  >
                    <span className={[
                      'absolute left-0 top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                      data.isPublic ? 'translate-x-[22px]' : 'translate-x-[2px]',
                    ].join(' ')} />
                  </button>
                </div>
              </div>

              <div className="bg-[#FF471A1A] border border-[#FF471A33] rounded-xl p-4 text-sm text-text-secondary">
                <p className="font-semibold text-text-primary mb-1">¡Todo listo!</p>
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
                onClick={goBack}
                disabled={isSubmitting}
                className="flex-1 bg-bg-tertiary hover:bg-border-default border border-border-default text-text-secondary py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                ← Atrás
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="flex-1 bg-[#FF471A] hover:bg-[#e03d15] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 text-white py-3 rounded-xl font-bold text-sm transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando…
                </span>
              ) : isLastStep ? (
                '🚀 Generar mi plan'
              ) : (
                'Siguiente →'
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-4">
          Paso {step + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  )
}
