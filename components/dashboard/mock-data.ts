// TODO: replace with real API calls when backend is ready

export const MOCK_USER = {
  name: 'Joan',
  streak: 5,
  weight: 75,
  weightUnit: 'kg',
  xpLevel: 3,
  xpLevelName: 'Consistente',
  xpCurrent: 340,
  xpMax: 500,
  completionRate: 80,
}

export const MOCK_TODAY_WORKOUT = {
  dayName: 'Día de Pecho',
  tag: 'Pecho + Tríceps',
  exercises: [
    { id: '1', name: 'Press de banca', sets: 4, reps: '8-10', rest: '90s' },
    { id: '2', name: 'Press inclinado con mancuernas', sets: 3, reps: '10-12', rest: '75s' },
    { id: '3', name: 'Fondos en paralelas', sets: 3, reps: '12-15', rest: '60s' },
    { id: '4', name: 'Extensiones de tríceps en polea', sets: 3, reps: '12-15', rest: '60s' },
    { id: '5', name: 'Press francés con barra EZ', sets: 3, reps: '10-12', rest: '60s' },
  ],
}

export const MOCK_WEEK_PLAN = [
  { short: 'L', name: 'Lunes', muscle: 'Pecho' },
  { short: 'M', name: 'Martes', muscle: 'Espalda' },
  { short: 'X', name: 'Miércoles', muscle: 'Piernas' },
  { short: 'J', name: 'Jueves', muscle: 'Hombros' },
  { short: 'V', name: 'Viernes', muscle: 'Pecho' },
  { short: 'S', name: 'Sábado', muscle: 'Descanso' },
  { short: 'D', name: 'Domingo', muscle: 'Descanso' },
]
