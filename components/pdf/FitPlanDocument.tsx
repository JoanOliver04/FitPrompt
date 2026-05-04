/**
 * components/pdf/FitPlanDocument.tsx
 *
 * Server-side only — imported exclusively by the export-pdf API route.
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
import type { ExerciseDay, Meal } from '@/lib/pdf-parser'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const ACCENT  = '#FF471A'
const DARK    = '#111111'
const SURFACE = '#F5F5F5'
const BORDER  = '#E5E5E5'
const MUTED   = '#888888'
const WHITE   = '#FFFFFF'
const TEXT    = '#1A1A1A'

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    backgroundColor: WHITE,
    paddingHorizontal: 40,
    paddingTop:      36,
    paddingBottom:   52,          // room for footer
    fontSize:        9,
    color:           TEXT,
    lineHeight:      1.4,
  },

  // ── Header band ─────────────────────────────────────────────────────────────
  header: {
    backgroundColor:  DARK,
    borderRadius:     8,
    paddingHorizontal: 22,
    paddingVertical:  14,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    marginBottom:     24,
  },
  logo: {
    color:      ACCENT,
    fontSize:   20,
    fontFamily: 'Helvetica-Bold',
  },
  logoSub: {
    color:    '#888888',
    fontSize: 7,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerName: {
    color:      WHITE,
    fontSize:   11,
    fontFamily: 'Helvetica-Bold',
  },
  headerDate: {
    color:    '#999999',
    fontSize: 8,
    marginTop: 2,
  },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize:          11,
    fontFamily:        'Helvetica-Bold',
    color:             TEXT,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    paddingBottom:     4,
    marginBottom:      10,
  },

  // ── Profile cards ────────────────────────────────────────────────────────────
  profileRow: {
    flexDirection: 'row',
  },
  profileCard: {
    flex:             1,
    backgroundColor:  SURFACE,
    borderRadius:     6,
    padding:          10,
    marginRight:      8,
  },
  profileCardLast: {
    marginRight: 0,
  },
  profileLabel: {
    color:       MUTED,
    fontSize:    7,
    marginBottom: 3,
  },
  profileValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   9,
  },

  // ── Day header ────────────────────────────────────────────────────────────────
  dayHeader: {
    backgroundColor:  DARK,
    borderRadius:     4,
    paddingHorizontal: 10,
    paddingVertical:  6,
    marginBottom:     4,
    marginTop:        12,
  },
  dayHeaderText: {
    color:      WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize:   8,
  },

  // ── Table ─────────────────────────────────────────────────────────────────────
  table: {
    borderWidth:  1,
    borderColor:  BORDER,
    borderRadius: 4,
    overflow:     'hidden',
    marginBottom: 2,
  },
  tableHeaderRow: {
    flexDirection:   'row',
    backgroundColor: ACCENT,
  },
  tableRow: {
    flexDirection:  'row',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: SURFACE,
  },
  cellBase: {
    paddingHorizontal: 7,
    paddingVertical:   5,
    fontSize:          8,
  },
  cellHeader: {
    fontFamily: 'Helvetica-Bold',
    color:      WHITE,
  },
  cellExercise: { flex: 3 },
  cellSetsReps: { flex: 2 },
  cellRest:     { flex: 1.5 },
  cellNotes:    { flex: 2.5, color: MUTED },

  // ── Meal card ─────────────────────────────────────────────────────────────────
  mealCard: {
    borderWidth:  1,
    borderColor:  BORDER,
    borderRadius: 6,
    marginBottom: 8,
    overflow:     'hidden',
  },
  mealHeader: {
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    paddingVertical:   7,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
  },
  mealName: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   9,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  mealTime: {
    fontSize: 8,
    color:    MUTED,
    marginRight: 8,
  },
  mealKcal: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   9,
    color:      ACCENT,
  },
  mealPlate: {
    paddingHorizontal: 10,
    paddingVertical:   6,
    fontSize:          8,
    color:             MUTED,
    fontFamily:        'Helvetica-Oblique',
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  empty: {
    padding:    16,
    color:      MUTED,
    fontSize:   9,
    fontFamily: 'Helvetica-Oblique',
    textAlign:  'center',
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    position:      'absolute',
    bottom:        20,
    left:          40,
    right:         40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop:    8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color:   MUTED,
    fontSize: 7,
  },
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExerciseTable({ days }: { days: ExerciseDay[] }) {
  if (days.length === 0) {
    return <Text style={s.empty}>No se encontró rutina en este chat.</Text>
  }

  return (
    <>
      {days.map((day) => (
        <View key={day.name} wrap={false}>
          <View style={s.dayHeader}>
            <Text style={s.dayHeaderText}>{day.name}</Text>
          </View>

          <View style={s.table}>
            {/* Header */}
            <View style={s.tableHeaderRow}>
              {(['Ejercicio', 'Series × Reps', 'Descanso', 'Notas'] as const).map(
                (col, i) => (
                  <Text
                    key={col}
                    style={[
                      s.cellBase,
                      s.cellHeader,
                      i === 0 ? s.cellExercise
                      : i === 1 ? s.cellSetsReps
                      : i === 2 ? s.cellRest
                      : s.cellNotes,
                    ]}
                  >
                    {col}
                  </Text>
                ),
              )}
            </View>

            {/* Rows */}
            {day.exercises.map((ex, idx) => (
              <View
                key={idx}
                style={[s.tableRow, idx % 2 !== 0 ? s.tableRowAlt : {}]}
              >
                <Text style={[s.cellBase, s.cellExercise]}>{ex.name}</Text>
                <Text style={[s.cellBase, s.cellSetsReps]}>{ex.setsReps}</Text>
                <Text style={[s.cellBase, s.cellRest]}>{ex.rest}</Text>
                <Text style={[s.cellBase, s.cellNotes]}>{ex.notes}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  )
}

function MealSection({ meals }: { meals: Meal[] }) {
  if (meals.length === 0) {
    return <Text style={s.empty}>No se encontró plan nutricional en este chat.</Text>
  }

  return (
    <>
      {meals.map((meal, i) => (
        <View key={i} style={s.mealCard} wrap={false}>
          <View style={s.mealHeader}>
            <Text style={s.mealName}>{meal.name}</Text>
            <View style={s.mealMeta}>
              {meal.time ? <Text style={s.mealTime}>{meal.time}</Text> : null}
              {meal.kcal ? <Text style={s.mealKcal}>{meal.kcal}</Text> : null}
            </View>
          </View>
          {meal.plate ? (
            <Text style={s.mealPlate}>{meal.plate}</Text>
          ) : null}
        </View>
      ))}
    </>
  )
}

// ─── Document props ───────────────────────────────────────────────────────────

export interface FitPlanDocumentProps {
  chatTitle:    string
  userName:     string
  exportDate:   Date
  profile: {
    goal:         string
    level:        string
    workoutType:  string
    daysPerWeek:  number
  } | null
  exerciseDays: ExerciseDay[]
  meals:        Meal[]
  goalLabel:    string
  levelLabel:   string
  workoutLabel: string
}

// ─── Document component ───────────────────────────────────────────────────────

function FitPlanDocument({
  chatTitle,
  userName,
  exportDate,
  profile,
  exerciseDays,
  meals,
  goalLabel,
  levelLabel,
  workoutLabel,
}: FitPlanDocumentProps) {
  const dateStr = exportDate.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Document
      title={chatTitle}
      author="FitPrompt"
      subject="Plan de entrenamiento y nutrición"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header} fixed>
          <View>
            <Text style={s.logo}>FitPrompt</Text>
            <Text style={s.logoSub}>Tu entrenador personal IA</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerName}>{userName}</Text>
            <Text style={s.headerDate}>{dateStr}</Text>
          </View>
        </View>

        {/* ── Section 1 — Datos del usuario ──────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Datos del usuario</Text>
          <View style={s.profileRow}>
            <View style={s.profileCard}>
              <Text style={s.profileLabel}>OBJETIVO</Text>
              <Text style={s.profileValue}>{goalLabel || '—'}</Text>
            </View>
            <View style={s.profileCard}>
              <Text style={s.profileLabel}>NIVEL</Text>
              <Text style={s.profileValue}>{levelLabel || '—'}</Text>
            </View>
            <View style={[s.profileCard, s.profileCardLast]}>
              <Text style={s.profileLabel}>TIPO DE ENTRENAMIENTO</Text>
              <Text style={s.profileValue}>
                {workoutLabel || '—'}
                {profile ? ` · ${profile.daysPerWeek} días/sem` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Section 2 — Rutina semanal ─────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Rutina semanal</Text>
          <ExerciseTable days={exerciseDays} />
        </View>

        {/* ── Section 3 — Plan nutricional ───────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Plan nutricional</Text>
          <MealSection meals={meals} />
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generado por FitPrompt</Text>
          <Text style={s.footerText}>{dateStr}</Text>
        </View>

      </Page>
    </Document>
  )
}

// ─── Server-side render helper ────────────────────────────────────────────────

/** Renders the PDF document to a Buffer. Call only from server-side code. */
export async function renderFitPlanDocument(
  props: FitPlanDocumentProps,
): Promise<Buffer> {
  return renderToBuffer(<FitPlanDocument {...props} />) as Promise<Buffer>
}
