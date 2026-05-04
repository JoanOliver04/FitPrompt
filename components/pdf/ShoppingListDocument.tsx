/**
 * components/pdf/ShoppingListDocument.tsx
 *
 * Server-side only — imported exclusively by the shopping-list export-pdf API route.
 * Never include in client components or client-side bundles.
 */

import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { ShoppingListCategory } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const ACCENT  = '#FF471A'
const DARK    = '#111111'
const WHITE   = '#FFFFFF'
const SURFACE = '#F8F8F8'
const TEXT    = '#1A1A1A'
const MUTED   = '#888888'
const BORDER  = '#E5E5E5'

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily:        'Helvetica',
    backgroundColor:   WHITE,
    paddingHorizontal: 40,
    paddingTop:        36,
    paddingBottom:     52,
    fontSize:          10,
    color:             TEXT,
    lineHeight:        1.4,
  },

  // ── Header band ─────────────────────────────────────────────────────────────
  header: {
    backgroundColor:   DARK,
    borderRadius:      8,
    paddingHorizontal: 22,
    paddingVertical:   14,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    marginBottom:      22,
  },
  headerLeft: {
    flexDirection: 'column',
    gap:           3,
  },
  headerTitle: {
    color:       WHITE,
    fontSize:    17,
    fontFamily:  'Helvetica-Bold',
  },
  headerSub: {
    color:          ACCENT,
    fontSize:       8,
    fontFamily:     'Helvetica-Bold',
    textTransform:  'uppercase',
    letterSpacing:  1,
  },
  headerDate: {
    color:    MUTED,
    fontSize: 8,
  },

  // ── Category card ────────────────────────────────────────────────────────────
  category: {
    marginBottom:  12,
    borderRadius:  6,
    overflow:      'hidden',
    border:        `1pt solid ${BORDER}`,
  },
  catHeader: {
    backgroundColor:   DARK,
    paddingHorizontal: 14,
    paddingVertical:   8,
  },
  catTitle: {
    color:      WHITE,
    fontSize:   10,
    fontFamily: 'Helvetica-Bold',
  },
  catAccentBar: {
    backgroundColor: ACCENT,
    height:          2,
  },

  // ── Item rows ────────────────────────────────────────────────────────────────
  itemRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 14,
    paddingVertical:   6,
    backgroundColor:   SURFACE,
    borderBottom:      `0.5pt solid ${BORDER}`,
  },
  itemRowAlt: {
    backgroundColor: WHITE,
  },
  itemRowLast: {
    borderBottom: 'none',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  bullet: {
    width:           5,
    height:          5,
    backgroundColor: ACCENT,
    borderRadius:    3,
    marginRight:     8,
  },
  itemName: {
    fontSize: 9,
    color:    TEXT,
  },
  itemAmount: {
    fontSize:   8,
    color:      MUTED,
    fontFamily: 'Helvetica-Oblique',
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    position:       'absolute',
    bottom:         20,
    left:           40,
    right:          40,
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  footerBrand: {
    fontSize:       7,
    fontFamily:     'Helvetica-Bold',
    textTransform:  'uppercase',
    letterSpacing:  1,
  },
  footerAccent: {
    color: ACCENT,
  },
  footerMuted: {
    color: MUTED,
  },
})

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  categories: ShoppingListCategory[]
}

function ShoppingListDoc({ categories }: Props) {
  const today = new Date().toLocaleDateString('es-ES', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })

  return (
    <Document title="Lista de la Compra — FitPrompt" author="FitPrompt">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Lista de la Compra</Text>
            <Text style={s.headerSub}>FitPrompt · Nutricion personalizada</Text>
          </View>
          <Text style={s.headerDate}>{today}</Text>
        </View>

        {/* Category sections */}
        {categories.map((cat) => (
          <View key={cat.name} style={s.category} wrap={false}>
            <View style={s.catHeader}>
              <Text style={s.catTitle}>{cat.name.toUpperCase()}</Text>
            </View>
            <View style={s.catAccentBar} />

            {cat.items.map((item, idx) => (
              <View
                key={item.name}
                style={[
                  s.itemRow,
                  idx % 2 === 1 ? s.itemRowAlt : {},
                  idx === cat.items.length - 1 ? s.itemRowLast : {},
                ]}
              >
                <View style={s.itemLeft}>
                  <View style={s.bullet} />
                  <Text style={s.itemName}>{item.name}</Text>
                </View>
                <Text style={s.itemAmount}>{item.amount}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer (repeated on every page) */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>
            <Text style={s.footerAccent}>Fit</Text>
            <Text style={s.footerMuted}>Prompt</Text>
          </Text>
          <Text
            style={s.footerMuted}
            render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
              `Pagina ${pageNumber} / ${totalPages}`
            }
          />
        </View>

      </Page>
    </Document>
  )
}

// ─── Public render function ───────────────────────────────────────────────────

export async function renderShoppingListDocument(
  categories: ShoppingListCategory[],
): Promise<Buffer> {
  return renderToBuffer(<ShoppingListDoc categories={categories} />)
}
