'use client'

import { useState } from 'react'

interface NotificationPrefs {
  new_follower:   boolean
  group_invite:   boolean
  rank_surpassed: boolean
}

interface ToggleRowProps {
  label:       string
  description: string
  checked:     boolean
  saving:      boolean
  onToggle:    () => void
}

function ToggleRow({ label, description, checked, saving, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-5 border-b border-border-default last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-semibold text-sm mb-0.5">{label}</p>
        <p className="text-text-muted text-xs leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={saving}
        onClick={onToggle}
        className={[
          'relative p-0 w-11 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5 disabled:opacity-60',
          checked ? 'bg-[#FF471A]' : 'bg-bg-tertiary border border-border-default',
        ].join(' ')}
      >
        <span className={[
          'absolute left-0 top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        ].join(' ')} />
      </button>
    </div>
  )
}

interface Props {
  initialPrefs: NotificationPrefs
}

export function NotificationPrefs({ initialPrefs }: Props) {
  const [prefs, setPrefs]   = useState<NotificationPrefs>(initialPrefs)
  const [saving, setSaving] = useState<keyof NotificationPrefs | null>(null)
  const [saved, setSaved]   = useState<keyof NotificationPrefs | null>(null)

  async function toggle(key: keyof NotificationPrefs) {
    const next = { ...prefs, [key]: !prefs[key] }
    setSaving(key)
    setSaved(null)
    setPrefs(next)

    const res = await fetch('/api/user/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ [key]: next[key] }),
    })

    if (!res.ok) {
      setPrefs(prefs) // revert on error
    } else {
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  const rows: Array<{ key: keyof NotificationPrefs; label: string; description: string }> = [
    {
      key:         'new_follower',
      label:       'Nuevos seguidores',
      description: 'Notificación cuando alguien empieza a seguirte.',
    },
    {
      key:         'group_invite',
      label:       'Invitaciones a grupos',
      description: 'Notificación cuando alguien te invita a un grupo.',
    },
    {
      key:         'rank_surpassed',
      label:       'Superado en ranking',
      description: 'Notificación cuando un contacto te supera en XP.',
    },
  ]

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden">
      {rows.map(({ key, label, description }) => (
        <div key={key} className="relative">
          {saved === key && (
            <span className="absolute top-4 right-16 text-[10px] text-green-400 font-semibold">Guardado</span>
          )}
          <ToggleRow
            label={label}
            description={description}
            checked={prefs[key]}
            saving={saving === key}
            onToggle={() => toggle(key)}
          />
        </div>
      ))}
    </div>
  )
}
