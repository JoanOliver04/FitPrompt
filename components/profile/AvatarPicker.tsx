'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PREDEFINED_AVATARS } from '@/lib/avatars'

interface Props {
  currentImage: string | null
  plan: string
}

function resizeToBase64(file: File, maxPx = 300, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export function AvatarPicker({ currentImage, plan }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(currentImage)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isPremium = plan === 'premium'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se admiten imágenes'); return }
    setError(null)
    try {
      const b64 = await resizeToBase64(file)
      setSelected(b64)
    } catch {
      setError('No se pudo procesar la imagen')
    }
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selected }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Error al guardar')
      }
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: selected }))
      router.refresh()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const changed = selected !== currentImage

  return (
    <div className="mt-4">
      <p className="text-text-secondary text-sm font-semibold mb-3">Cambiar avatar</p>

      {/* Predefined grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {PREDEFINED_AVATARS.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setSelected(url)}
            className={[
              'w-10 h-10 rounded-xl overflow-hidden border-2 transition-all',
              selected === url
                ? 'border-[#FF471A] scale-110 shadow-lg'
                : 'border-transparent hover:border-[#FF471A66]',
            ].join(' ')}
            title="Seleccionar avatar"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="avatar" className="w-full h-full" />
          </button>
        ))}
      </div>

      {/* Premium upload */}
      {isPremium && (
        <div className="mb-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-xs text-text-secondary border border-border-default hover:border-text-subtle rounded-xl px-4 py-2.5 transition-all hover:text-text-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Subir foto propia
            <span className="ml-1 text-[9px] bg-[#FF471A]/15 text-[#FF471A] border border-[#FF471A]/30 px-1.5 py-0.5 rounded-full font-bold">PREMIUM</span>
          </button>
          <p className="text-text-muted text-[11px] mt-1.5">Máx. 200 KB · Se redimensiona a 300×300 px</p>

          {/* Preview if uploaded file selected */}
          {selected?.startsWith('data:') && (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected} alt="preview" className="w-10 h-10 rounded-xl object-cover border border-border-default" />
              <span className="text-xs text-text-secondary">Vista previa</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      {success && <p className="text-green-400 text-xs mb-3">¡Avatar actualizado!</p>}

      <button
        type="button"
        onClick={save}
        disabled={!changed || saving}
        className="px-5 py-2 rounded-xl bg-[#FF471A] text-white text-sm font-bold transition-all hover:bg-[#e03d15] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        {saving ? 'Guardando…' : 'Guardar avatar'}
      </button>
    </div>
  )
}
