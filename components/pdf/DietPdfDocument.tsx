/**
 * components/pdf/DietPdfDocument.tsx
 *
 * Server-only renderer for the weekly diet PDF. Keep this file out of any
 * client bundle; @react-pdf/renderer doesn't run in the browser.
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
import type { DietDay } from '@/lib/pdf-parser'

const ACCENT  = '#FF471A'
const DARK    = '#111111'
const SURFACE = '#F5F5F5'
const BORDER  = '#E5E5E5'
const MUTED   = '#888888'
const WHITE   = '#FFFFFF'
const TEXT    = '#1A1A1A'

const s = StyleSheet.create({
  page: {
    fontFamily:        'Helvetica',
    backgroundColor:   WHITE,
    paddingHorizontal: 40,
    paddingTop:        36,
    paddingBottom:     52,
    fontSize:          9,
    color:             TEXT,
    lineHeight:        1.4,
  },
  header: {
    backgroundColor:   DARK,
    borderRadius:      8,
    paddingHorizontal: 22,
    paddingVertical:   14,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    marginBottom:      18,
  },
  logo:       { color: ACCENT, fontSize: 20, fontFamily: 'Helvetica-Bold' },
  logoSub:    { color: '#888888', fontSize: 7, marginTop: 2 },
  headerRight:{ alignItems: 'flex-end' },
  headerName: { color: WHITE, fontSize: 11, fontFamily: 'Helvetica-Bold' },
  headerDate: { color: '#999999', fontSize: 8, marginTop: 2 },

  intro: {
    backgroundColor:   SURFACE,
    borderRadius:      6,
    padding:           10,
    marginBottom:      18,
  },
  introTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 4 },
  introLine:  { fontSize: 8, color: MUTED },

  dayWrap: { marginBottom: 16 },
  dayHeader: {
    backgroundColor:   DARK,
    borderRadius:      4,
    paddingHorizontal: 10,
    paddingVertical:   6,
    marginBottom:      6,
  },
  dayHeaderText: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 9 },

  mealCard: {
    borderWidth:  1,
    borderColor:  BORDER,
    borderRadius: 6,
    marginBottom: 6,
    overflow:     'hidden',
  },
  mealHeader: {
    backgroundColor:   SURFACE,
    paddingHorizontal: 10,
    paddingVertical:   6,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
  },
  mealName: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  mealMeta: { flexDirection: 'row', alignItems: 'center' },
  mealTime: { fontSize: 8, color: MUTED, marginRight: 8 },
  mealKcal: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: ACCENT },
  mealPlate: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    fontSize:          8,
    color:             MUTED,
    fontFamily:        'Helvetica-Oblique',
  },

  empty: {
    padding:    16,
    color:      MUTED,
    fontSize:   9,
    fontFamily: 'Helvetica-Oblique',
    textAlign:  'center',
  },

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
  footerText: { color: MUTED, fontSize: 7 },
})

export interface DietPdfProps {
  userName:    string
  exportDate:  Date
  days:        DietDay[]
  macroTarget: {
    calories: number
    protein:  number
    carbs:    number
    fat:      number
  } | null
}

function DietPdfDocument({ userName, exportDate, days, macroTarget }: DietPdfProps) {
  const dateStr = exportDate.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <Document title="Plan de Alimentación" author="FitPrompt" subject="Plan nutricional semanal">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.logo}>FitPrompt</Text>
            <Text style={s.logoSub}>Plan nutricional</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerName}>{userName}</Text>
            <Text style={s.headerDate}>{dateStr}</Text>
          </View>
        </View>

        {macroTarget && (
          <View style={s.intro}>
            <Text style={s.introTitle}>Targets diarios</Text>
            <Text style={s.introLine}>
              {macroTarget.calories} kcal · Proteína {macroTarget.protein} g · Carbos {macroTarget.carbs} g · Grasa {macroTarget.fat} g
            </Text>
          </View>
        )}

        {days.length === 0 ? (
          <Text style={s.empty}>No se detectó un plan nutricional en este mensaje.</Text>
        ) : (
          days.map((day, dayIdx) => (
            <View key={dayIdx} style={s.dayWrap} wrap={false}>
              <View style={s.dayHeader}>
                <Text style={s.dayHeaderText}>{day.name}</Text>
              </View>
              {day.meals.map((meal, mealIdx) => (
                <View key={mealIdx} style={s.mealCard}>
                  <View style={s.mealHeader}>
                    <Text style={s.mealName}>{meal.name}</Text>
                    <View style={s.mealMeta}>
                      {meal.time ? <Text style={s.mealTime}>{meal.time}</Text> : null}
                      {meal.kcal ? <Text style={s.mealKcal}>{meal.kcal}</Text> : null}
                    </View>
                  </View>
                  {meal.plate ? <Text style={s.mealPlate}>{meal.plate}</Text> : null}
                </View>
              ))}
            </View>
          ))
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generado por FitPrompt</Text>
          <Text style={s.footerText}>{dateStr}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function renderDietPdfDocument(props: DietPdfProps): Promise<Buffer> {
  return renderToBuffer(<DietPdfDocument {...props} />) as Promise<Buffer>
}
