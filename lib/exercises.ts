import type { Exercise, MuscleGroup, ExerciseType, Equipment } from '@/types'

// ─── Label maps (shared between components) ───────────────────────────────────

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest:     'Pecho',
  back:      'Espalda',
  legs:      'Piernas',
  shoulders: 'Hombros',
  arms:      'Brazos',
  core:      'Core',
  glutes:    'Glúteos',
  full_body: 'Cuerpo completo',
}

export const TYPE_LABELS: Record<ExerciseType, string> = {
  strength:    'Fuerza',
  cardio:      'Cardio',
  hiit:        'HIIT',
  flexibility: 'Flexibilidad',
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell:    'Barra',
  dumbbell:   'Mancuerna',
  machine:    'Máquina',
  bodyweight: 'Peso corporal',
  cables:     'Cables',
  kettlebell: 'Kettlebell',
  bands:      'Bandas',
}

export const LEVEL_LABELS: Record<Exercise['level'], string> = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest:     '#ef4444',
  back:      '#3b82f6',
  legs:      '#22c55e',
  shoulders: '#a855f7',
  arms:      '#f97316',
  core:      '#eab308',
  glutes:    '#ec4899',
  full_body: '#FF471A',
}

export const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  chest:     '🏋️',
  back:      '🚣',
  legs:      '🦵',
  shoulders: '🎯',
  arms:      '💪',
  core:      '⚡',
  glutes:    '🏃',
  full_body: '🔥',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Replace getExercises / getExerciseById with real API calls when ready.

const EXERCISES: Exercise[] = [
  {
    id: 'press-banca',
    name: 'Press de Banca',
    muscleGroup: 'chest',
    secondaryMuscles: ['Tríceps', 'Deltoides anterior'],
    type: 'strength',
    equipment: ['barbell'],
    level: 'intermediate',
    instructions: [
      'Túmbate en el banco con los pies apoyados firmes en el suelo.',
      'Agarra la barra con un agarre ligeramente más ancho que los hombros.',
      'Desrackea la barra y colócala sobre el pecho con los codos a 45–75°.',
      'Baja la barra de forma controlada hasta rozar el esternón.',
      'Empuja explosivamente hacia arriba extendiendo los brazos.',
    ],
    muscles: ['Pectoral mayor', 'Tríceps braquial', 'Deltoides anterior'],
    tips: [
      'No arquees excesivamente la espalda baja.',
      'Mantén los omóplatos retraídos y deprimidos contra el banco.',
      'Controla la bajada: al menos 2 segundos en el descenso.',
    ],
  },
  {
    id: 'sentadilla-barra',
    name: 'Sentadilla con Barra',
    muscleGroup: 'legs',
    secondaryMuscles: ['Glúteos', 'Core', 'Isquiotibiales'],
    type: 'strength',
    equipment: ['barbell'],
    level: 'intermediate',
    instructions: [
      'Coloca la barra sobre los trapecios (sentadilla alta) o en la parte baja de los hombros.',
      'Separa los pies a la anchura de los hombros, puntas ligeramente hacia fuera.',
      'Mantén el pecho erguido y la mirada al frente.',
      'Baja controlando la cadera hacia atrás y abajo hasta que los muslos queden paralelos al suelo.',
      'Sube impulsando con los talones hasta extender completamente las piernas.',
    ],
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Core'],
    tips: [
      'Las rodillas no deben caer hacia adentro durante el movimiento.',
      'Mantén el core activado y la respiración abdominal.',
      'Empuja el suelo con los talones al subir, no con las puntas.',
    ],
  },
  {
    id: 'peso-muerto',
    name: 'Peso Muerto',
    muscleGroup: 'back',
    secondaryMuscles: ['Glúteos', 'Isquiotibiales', 'Core'],
    type: 'strength',
    equipment: ['barbell'],
    level: 'advanced',
    instructions: [
      'Párate frente a la barra con los pies a la anchura de caderas, barra sobre el mediopié.',
      'Agáchate manteniendo la espalda neutra y agarra la barra a la anchura de los hombros.',
      'Activa el core, retrae los omóplatos y empuja el suelo hacia abajo con los pies.',
      'Sube la barra pegada al cuerpo extendiendo caderas y rodillas simultáneamente.',
      'Al llegar arriba, extiende caderas completamente sin hiperextender la lumbar.',
    ],
    muscles: ['Erector espinal', 'Glúteos', 'Isquiotibiales', 'Trapecio', 'Core'],
    tips: [
      'Nunca redondees la espalda baja: es la causa principal de lesiones.',
      'La barra debe rozar las tibias en todo el recorrido.',
      'Empieza con pesos bajos para dominar la técnica antes de añadir carga.',
    ],
  },
  {
    id: 'dominadas',
    name: 'Dominadas',
    muscleGroup: 'back',
    secondaryMuscles: ['Bíceps', 'Core'],
    type: 'strength',
    equipment: ['bodyweight'],
    level: 'intermediate',
    instructions: [
      'Agarra la barra con agarre prono (manos mirando hacia fuera) a la anchura de los hombros.',
      'Cuelga con los brazos completamente extendidos y el core activado.',
      'Jala los codos hacia las caderas tirando de la barra hacia ti.',
      'Sube hasta que la barbilla supere la barra.',
      'Baja de forma controlada hasta la extensión completa.',
    ],
    muscles: ['Dorsal ancho', 'Trapecio inferior', 'Bíceps braquial', 'Romboides'],
    tips: [
      'Evita el balanceo: el movimiento debe ser limpio y controlado.',
      'Retrae los omóplatos antes de iniciar el tirón.',
      'Si no puedes hacer una repetición limpia, usa una banda de resistencia como asistencia.',
    ],
  },
  {
    id: 'press-militar',
    name: 'Press Militar',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['Tríceps', 'Trapecio'],
    type: 'strength',
    equipment: ['barbell'],
    level: 'intermediate',
    instructions: [
      'De pie o sentado, sujeta la barra a la altura de la clavícula con agarre a la anchura de los hombros.',
      'Activa el core y mantén la espalda neutra.',
      'Empuja la barra verticalmente por encima de la cabeza hasta extender los brazos.',
      'Baja la barra de forma controlada hasta la posición inicial.',
    ],
    muscles: ['Deltoides anterior', 'Deltoides lateral', 'Tríceps braquial', 'Trapecio'],
    tips: [
      'No hiperextiendas la zona lumbar al empujar: mantén el core apretado.',
      'La barra debe trazar una línea vertical en todo el recorrido.',
      'Evita inclinarte hacia atrás para compensar la falta de movilidad de hombros.',
    ],
  },
  {
    id: 'curl-biceps',
    name: 'Curl de Bíceps',
    muscleGroup: 'arms',
    secondaryMuscles: ['Braquial', 'Braquiorradial'],
    type: 'strength',
    equipment: ['dumbbell'],
    level: 'beginner',
    instructions: [
      'De pie, sujeta una mancuerna en cada mano con las palmas hacia arriba.',
      'Mantén los codos pegados al cuerpo durante todo el movimiento.',
      'Flexiona el codo levantando la mancuerna hacia el hombro.',
      'Aprieta el bíceps en la contracción máxima.',
      'Baja de forma controlada hasta la extensión completa.',
    ],
    muscles: ['Bíceps braquial', 'Braquial', 'Braquiorradial'],
    tips: [
      'No balancees el cuerpo para subir el peso: usa solo el bíceps.',
      'El codo debe permanecer fijo a lo largo del movimiento.',
      'Controla especialmente la fase excéntrica (bajada).',
    ],
  },
  {
    id: 'plancha',
    name: 'Plancha Abdominal',
    muscleGroup: 'core',
    secondaryMuscles: ['Hombros', 'Glúteos'],
    type: 'strength',
    equipment: ['bodyweight'],
    level: 'beginner',
    instructions: [
      'Apoya los antebrazos y los pies en el suelo, formando una línea recta de cabeza a talones.',
      'Activa el core evitando que las caderas suban o bajen.',
      'Mantén la posición el tiempo indicado sin perder la alineación.',
      'Respira de forma constante durante el ejercicio.',
    ],
    muscles: ['Recto abdominal', 'Transverso abdominal', 'Oblicuos', 'Estabilizadores de cadera'],
    tips: [
      'No mantengas la respiración: exhala de forma continua.',
      'Si las caderas caen, detente y descansa antes de continuar.',
      'Aumenta el tiempo progresivamente: empieza con 20–30 s y ve aumentando.',
    ],
  },
  {
    id: 'fondos-paralelas',
    name: 'Fondos en Paralelas',
    muscleGroup: 'chest',
    secondaryMuscles: ['Tríceps', 'Deltoides anterior'],
    type: 'strength',
    equipment: ['bodyweight'],
    level: 'intermediate',
    instructions: [
      'Sujeta las barras paralelas con los brazos extendidos, piernas cruzadas hacia atrás.',
      'Inclina ligeramente el torso hacia adelante para enfatizar el pecho.',
      'Flexiona los codos bajando el cuerpo hasta que los hombros queden por debajo de los codos.',
      'Empuja hacia arriba extendiendo los brazos hasta la posición inicial.',
    ],
    muscles: ['Pectoral mayor', 'Tríceps braquial', 'Deltoides anterior'],
    tips: [
      'Si inclines menos el torso, trabajarás más el tríceps.',
      'No bajes en exceso: el hombro no debe quedar por debajo del codo.',
      'Si no tienes fuerza suficiente, usa una banda de resistencia como asistencia.',
    ],
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroup: 'glutes',
    secondaryMuscles: ['Isquiotibiales', 'Core'],
    type: 'strength',
    equipment: ['barbell'],
    level: 'intermediate',
    instructions: [
      'Apoya la parte superior de la espalda en un banco a la altura de los omóplatos.',
      'Coloca la barra sobre las caderas protegida con un acolchado.',
      'Pies apoyados en el suelo a la anchura de caderas, rodillas a 90°.',
      'Empuja las caderas hacia arriba hasta alinear torso y muslos.',
      'Aprieta los glúteos en la posición alta durante 1–2 segundos.',
    ],
    muscles: ['Glúteo mayor', 'Glúteo medio', 'Isquiotibiales'],
    tips: [
      'La barbilla debe mirar hacia abajo para mantener la posición neutral de la columna.',
      'Empuja a través de los talones, no de las puntas.',
      'Evita hiperextender la lumbar en la posición alta.',
    ],
  },
  {
    id: 'remo-mancuerna',
    name: 'Remo con Mancuerna',
    muscleGroup: 'back',
    secondaryMuscles: ['Bíceps', 'Romboides'],
    type: 'strength',
    equipment: ['dumbbell'],
    level: 'beginner',
    instructions: [
      'Apoya la rodilla y la mano del mismo lado en un banco para estabilizarte.',
      'Agarra la mancuerna con el brazo extendido hacia abajo.',
      'Tira de la mancuerna hacia la cadera flexionando el codo.',
      'En la contracción máxima, retrae el omóplato.',
      'Baja de forma controlada hasta la extensión completa.',
    ],
    muscles: ['Dorsal ancho', 'Trapecio', 'Romboides', 'Bíceps braquial'],
    tips: [
      'Evita rotar el torso para subir más peso: limita el movimiento al brazo.',
      'El codo debe apuntar hacia el techo en la posición alta.',
      'Mantén la espalda paralela al suelo durante todo el ejercicio.',
    ],
  },
  {
    id: 'zancadas',
    name: 'Zancadas con Mancuerna',
    muscleGroup: 'legs',
    secondaryMuscles: ['Glúteos', 'Core'],
    type: 'strength',
    equipment: ['dumbbell'],
    level: 'beginner',
    instructions: [
      'De pie, sujeta una mancuerna en cada mano a los lados del cuerpo.',
      'Da un paso largo hacia adelante con una pierna.',
      'Baja la rodilla trasera hacia el suelo sin llegar a tocarlo.',
      'La rodilla delantera no debe sobrepasar la punta del pie.',
      'Empuja con el pie delantero para volver a la posición inicial.',
    ],
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Gemelos'],
    tips: [
      'Mantén el torso erguido durante todo el movimiento.',
      'Da un paso suficientemente largo para que la rodilla no adelante al pie.',
      'Empieza sin peso para dominar el equilibrio y la técnica.',
    ],
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones Laterales',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['Trapecio superior'],
    type: 'strength',
    equipment: ['dumbbell'],
    level: 'beginner',
    instructions: [
      'De pie, sujeta una mancuerna en cada mano con las palmas hacia adentro.',
      'Mantén una ligera flexión en los codos durante todo el movimiento.',
      'Eleva los brazos lateralmente hasta la altura de los hombros.',
      'Mantén 1 segundo en la posición alta.',
      'Baja de forma controlada sin dejar caer el peso.',
    ],
    muscles: ['Deltoides lateral', 'Deltoides anterior', 'Trapecio superior'],
    tips: [
      'Usa pesos ligeros: el deltoides lateral es un músculo pequeño.',
      'No encoja los hombros al subir: puede causar impingement.',
      'El movimiento debe provenir del hombro, no del torso.',
    ],
  },
  {
    id: 'crunch',
    name: 'Crunch Abdominal',
    muscleGroup: 'core',
    secondaryMuscles: ['Oblicuos'],
    type: 'strength',
    equipment: ['bodyweight'],
    level: 'beginner',
    instructions: [
      'Túmbate boca arriba con las rodillas flexionadas y los pies apoyados en el suelo.',
      'Coloca las manos detrás de la cabeza sin entrelazar los dedos.',
      'Activa el core y despega los hombros del suelo hacia las rodillas.',
      'Mantén la parte baja de la espalda en contacto con el suelo.',
      'Baja de forma controlada sin dejar caer la cabeza.',
    ],
    muscles: ['Recto abdominal', 'Oblicuos externos'],
    tips: [
      'No tires del cuello con las manos: el movimiento debe venir del abdomen.',
      'No necesitas subir completamente: con elevar los omóplatos es suficiente.',
      'Exhala al subir para aumentar la contracción abdominal.',
    ],
  },
  {
    id: 'burpees',
    name: 'Burpees',
    muscleGroup: 'full_body',
    secondaryMuscles: ['Core', 'Hombros'],
    type: 'hiit',
    equipment: ['bodyweight'],
    level: 'intermediate',
    instructions: [
      'De pie, baja en cuclillas y apoya las manos en el suelo.',
      'Salta o camina con los pies hacia atrás hasta la posición de plancha.',
      'Realiza una flexión de pecho completa.',
      'Salta o camina con los pies hacia las manos.',
      'Salta explosivamente hacia arriba con los brazos extendidos sobre la cabeza.',
    ],
    muscles: ['Pectoral', 'Cuádriceps', 'Glúteos', 'Hombros', 'Core', 'Gemelos'],
    tips: [
      'Ajusta el ritmo a tu nivel: empieza lento y aumenta la velocidad gradualmente.',
      'Si tienes problemas de rodilla, evita saltar y haz la versión paso a paso.',
      'Mantén el core activo durante toda la secuencia para proteger la espalda.',
    ],
  },
  {
    id: 'sentadilla-goblet',
    name: 'Sentadilla Goblet',
    muscleGroup: 'legs',
    secondaryMuscles: ['Glúteos', 'Core'],
    type: 'strength',
    equipment: ['kettlebell'],
    level: 'beginner',
    instructions: [
      'Sujeta una kettlebell o mancuerna vertical con ambas manos frente al pecho.',
      'Separa los pies ligeramente más que la anchura de caderas, puntas hacia fuera.',
      'Mantén el pecho erguido y el core activado.',
      'Baja hasta que los codos toquen el interior de las rodillas.',
      'Sube empujando el suelo con los talones.',
    ],
    muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Core'],
    tips: [
      'Es el ejercicio ideal para aprender la mecánica de la sentadilla.',
      'El peso frente al cuerpo actúa como contrapeso y facilita la posición erguida.',
      'Usa los codos para abrir las rodillas hacia afuera en la posición baja.',
    ],
  },
]

// ─── Query functions ───────────────────────────────────────────────────────────
// Async signatures ready to swap for real API calls.

export async function getExercises(): Promise<Exercise[]> {
  return EXERCISES
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  return EXERCISES.find((e) => e.id === id) ?? null
}
