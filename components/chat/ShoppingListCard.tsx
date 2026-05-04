'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ShoppingList, ShoppingListCategory } from '@/types'
import { SHOPPING_LIST_SENTINEL } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseContent(content: string): ShoppingList | null {
  try {
    return JSON.parse(content.slice(SHOPPING_LIST_SENTINEL.length)) as ShoppingList
  } catch {
    return null
  }
}

function formatForClipboard(categories: ShoppingListCategory[]): string {
  const header = '🛒 LISTA DE LA COMPRA\n' + '─'.repeat(28) + '\n\n'
  const body = categories
    .map((cat) => {
      const items = cat.items
        .map((i) => `  • ${i.name}${i.amount ? ` (${i.amount})` : ''}`)
        .join('\n')
      return `${cat.emoji} ${cat.name.toUpperCase()}\n${items}`
    })
    .join('\n\n')
  return header + body + '\n\n── Generado por FitPrompt'
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  content: string
}

export function ShoppingListCard({ content }: Props) {
  const [copied, setCopied] = useState(false)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const list = useMemo(() => parseContent(content), [content])
  const categories = list?.categories ?? []

  // All hooks defined before any conditional return
  const handleCopy = useCallback(async () => {
    if (!categories.length) return
    const text = formatForClipboard(categories)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [categories])

  const handleExportPdf = useCallback(async () => {
    if (!categories.length || pdfStatus === 'loading') return
    setPdfStatus('loading')

    try {
      const res = await fetch('/api/shopping-list/export-pdf', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ categories }),
      })

      if (!res.ok) throw new Error('PDF generation failed')

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'lista-compra-fitprompt.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setPdfStatus('idle')
    } catch {
      setPdfStatus('error')
      setTimeout(() => setPdfStatus('idle'), 3000)
    }
  }, [categories, pdfStatus])

  if (!list || categories.length === 0) return null

  return (
    <div className="w-72 rounded-2xl overflow-hidden border border-border-default rounded-tl-sm shadow-sm">

      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0" aria-hidden="true">🛒</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">Lista de la Compra</p>
            <p className="text-[10px] text-text-secondary/50">Personalizada por FitCoach</p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-full font-semibold tracking-wide">
          IA
        </span>
      </div>

      {/* Categories */}
      <div className="bg-bg-secondary divide-y divide-border-default/40">
        {categories.map((cat) => (
          <div key={cat.name} className="px-4 py-3">
            <p className="text-[10px] font-bold text-text-secondary/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span aria-hidden="true">{cat.emoji}</span>
              {cat.name}
            </p>
            <ul className="space-y-1.5">
              {cat.items.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm text-text-secondary min-w-0">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.name}</span>
                  </span>
                  {item.amount && (
                    <span className="text-[11px] text-text-secondary/50 font-mono shrink-0 tabular-nums">
                      {item.amount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="bg-[#161616] border-t border-border-default px-4 py-3 flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all duration-200 active:scale-95 ${
            copied
              ? 'border-green-700/50 bg-green-950/30 text-green-400'
              : 'border-border-default text-text-secondary hover:border-accent/40 hover:text-accent hover:bg-accent/5'
          }`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? 'Copiado' : 'Copiar lista'}</span>
        </button>

        <button
          onClick={handleExportPdf}
          disabled={pdfStatus === 'loading'}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
            pdfStatus === 'error'
              ? 'border-red-700/50 bg-red-950/30 text-red-400'
              : 'border-border-default text-text-secondary hover:border-accent/40 hover:text-accent hover:bg-accent/5'
          }`}
        >
          {pdfStatus === 'loading' ? <SpinnerIcon /> : <DownloadIcon />}
          <span>
            {pdfStatus === 'loading'
              ? 'Generando…'
              : pdfStatus === 'error'
              ? 'Reintentar'
              : 'Exportar PDF'}
          </span>
        </button>
      </div>

    </div>
  )
}
