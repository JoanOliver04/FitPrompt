'use client'

import { useState } from 'react'

interface Props {
  initialIsPublic: boolean
}

export function PrivacyToggle({ initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  async function toggle() {
    const next = !isPublic
    setSaving(true)
    setSaved(false)
    setIsPublic(next)

    const res = await fetch('/api/user/privacy', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isPublic: next }),
    })

    if (!res.ok) {
      setIsPublic(isPublic) // revert on error
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-text-primary font-semibold text-sm">
              {isPublic ? '🔓 Cuenta pública' : '🔒 Cuenta privada'}
            </p>
            {saved && <span className="text-[10px] text-green-400 font-semibold">Guardado</span>}
          </div>
          <p className="text-text-muted text-xs leading-relaxed">
            {isPublic
              ? 'Cualquiera puede seguirte directamente. Si cambias a privado, los nuevos seguidores deberán enviar una solicitud.'
              : 'Los nuevos seguidores deben enviar una solicitud que tú aceptas o rechazas. Los que ya te siguen no se ven afectados.'}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          disabled={saving}
          onClick={toggle}
          className={[
            'relative p-0 w-11 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5 disabled:opacity-60',
            !isPublic ? 'bg-[#FF471A]' : 'bg-bg-tertiary border border-border-default',
          ].join(' ')}
        >
          <span className={[
            'absolute left-0 top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            !isPublic ? 'translate-x-[22px]' : 'translate-x-[2px]',
          ].join(' ')} />
        </button>
      </div>
    </div>
  )
}
