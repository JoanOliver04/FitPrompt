# Descripción de la Base de Datos — FitPrompt

**Motor:** PostgreSQL · **Alojamiento:** Supabase · **ORM:** Prisma v7 · **Conexión:** Connection pooling vía Supabase

---

## 4.1. Estructura de datos

El sistema está compuesto por **8 tablas** organizadas en torno al usuario central:

| Tabla                | Propósito principal                                              | Relación con `User` |
|----------------------|------------------------------------------------------------------|---------------------|
| `User`               | Identidad, autenticación y plan de suscripción                   | Entidad raíz        |
| `UserProfile`        | Perfil físico y preferencias → alimenta el prompt de IA          | 1 : 1               |
| `Chat`               | Agrupador de conversaciones con la IA                            | 1 : N               |
| `Message`            | Turnos de cada conversación (user / assistant / system)          | Chat → 1 : N        |
| `WorkoutLog`         | Entrenamientos registrados por el usuario                        | 1 : N               |
| `WeightLog`          | Historial de peso corporal para gráficas de progreso             | 1 : N               |
| `Achievement`        | Insignias desbloqueadas (sistema de gamificación)                | 1 : N               |
| `DailyMessageCount`  | Contador de mensajes por día para rate-limiting del plan free     | 1 : N               |

### Diagrama de relaciones

```
User ──────────────── UserProfile          (1:1)
  │
  ├──── Chat ──────── Message              (1:N → 1:N)
  │
  ├──── WorkoutLog                         (1:N)
  │
  ├──── WeightLog                          (1:N)
  │
  ├──── Achievement                        (1:N)
  │
  └──── DailyMessageCount                  (1:N)
```

---

## 4.2. Descripción de las tablas

### `User`

Entidad central. Almacena la identidad del usuario y su nivel de acceso al producto.

| Campo       | Tipo       | Nulable | Utilidad para la aplicación                                                   |
|-------------|------------|---------|-------------------------------------------------------------------------------|
| `id`        | String     | No      | Clave primaria (cuid). Se usa en cada query para aislar datos por usuario.    |
| `email`     | String     | No      | Identificador único de login. Se normaliza a minúsculas en registro.          |
| `name`      | String     | Sí      | Se muestra en la cabecera del dashboard y en el saludo del chat.              |
| `image`     | String     | Sí      | URL de avatar procedente de Google OAuth. Usada en el componente de perfil.   |
| `password`  | String     | Sí      | Hash bcrypt. Nulo si el usuario se registró por Google OAuth.                 |
| `plan`      | Enum       | No      | `free` \| `premium`. **Todas las restricciones de acceso se validan contra este campo en el backend.** |
| `createdAt` | DateTime   | No      | Fecha de alta. Se usa para calcular el badge `week_1` y `committed`.          |
| `updatedAt` | DateTime   | No      | Actualizado automáticamente por Prisma en cada modificación.                  |

---

### `UserProfile`

Perfil físico y de preferencias. Es **la tabla más crítica para la IA**: sus campos se serializan y se inyectan en cada prompt como contexto personalizado.

| Campo              | Tipo      | Nulable | Utilidad para la inteligencia de la aplicación                                          |
|--------------------|-----------|---------|------------------------------------------------------------------------------------------|
| `userId`           | String    | No      | FK → User. Constraint único (relación 1:1).                                              |
| `age`              | Int       | Sí      | Se usa para calcular el BMR (Mifflin-St Jeor) y el TDEE del usuario.                    |
| `weight`           | Float     | Sí      | Peso en kg. Entra en el cálculo de macros (proteínas = peso × 2 g/kg).                  |
| `height`           | Float     | Sí      | Altura en cm. Usada en BMR, TDEE e IMC. El IMC se muestra en el prompt como contexto.   |
| `gender`           | Enum      | Sí      | `male` \| `female` \| `other`. Ajusta la fórmula de BMR (constante diferente por sexo). |
| `goal`             | Enum      | Sí      | `volume` \| `definition` \| `maintenance` \| `weight_loss`. Determina el superávit/déficit calórico y la distribución de macros en el prompt. |
| `level`            | Enum      | Sí      | `beginner` \| `intermediate` \| `advanced`. La IA adapta la complejidad y el volumen de los ejercicios propuestos. |
| `daysPerWeek`      | Int       | Sí      | Días de entrenamiento semanales. La IA distribuye los grupos musculares según este valor.|
| `sessionTime`      | String    | Sí      | Duración por sesión: `<30`, `30-45`, `45-60`, `>60` min. La IA ajusta el número de ejercicios y series. |
| `workoutType`      | Enum      | Sí      | `gym` \| `home` \| `bodyweight`. Filtra los ejercicios propuestos según el equipamiento disponible. |
| `schedule`         | Enum      | Sí      | `morning` \| `midday` \| `afternoon` \| `night`. Aparece en el prompt para adaptar recomendaciones de nutrición pre/post entreno. |
| `injuries`         | String    | Sí      | Texto libre. La IA lo recibe como advertencia explícita para excluir ejercicios contraindicados. |
| `allergies`        | String    | Sí      | Texto libre. Excluye alimentos del plan nutricional generado.                            |
| `foodPreferences`  | String[]  | No      | Lista de preferencias (vegano, sin gluten…). Determina el enfoque dietético del plan.   |
| `extraInfo`        | String    | Sí      | Campo libre. El usuario puede añadir cualquier restricción o preferencia adicional que no encaja en los enums. |

---

### `Chat`

Contenedor de una sesión de conversación. Permite al usuario tener múltiples conversaciones independientes (limitadas a 3 en plan free).

| Campo       | Tipo     | Nulable | Utilidad                                                                     |
|-------------|----------|---------|------------------------------------------------------------------------------|
| `id`        | String   | No      | PK. Se usa para verificar la propiedad del chat antes de leer/borrar mensajes. |
| `userId`    | String   | No      | FK → User. Garantiza aislamiento: un usuario solo accede a sus propios chats. |
| `title`     | String   | No      | Generado a partir del primer mensaje. Se muestra en el listado de chats.     |
| `createdAt` | DateTime | No      | Fecha de creación.                                                           |
| `updatedAt` | DateTime | No      | Se actualiza al guardar un nuevo mensaje, para ordenar chats por actividad reciente. |

---

### `Message`

Cada turno de la conversación. Se almacena el historial completo para enviarlo a la API de IA y mantener el contexto entre respuestas.

| Campo       | Tipo     | Nulable | Utilidad                                                                                  |
|-------------|----------|---------|-------------------------------------------------------------------------------------------|
| `id`        | String   | No      | PK.                                                                                       |
| `chatId`    | String   | No      | FK → Chat.                                                                                |
| `role`      | Enum     | No      | `user` \| `assistant` \| `system`. El rol `system` se filtra al renderizar el chat en UI, pero se envía a la IA para mantener el contexto del perfil del usuario. |
| `content`   | String   | No      | Texto del mensaje. Puede contener Markdown (la IA devuelve respuestas formateadas).       |
| `createdAt` | DateTime | No      | Timestamp para ordenar los mensajes cronológicamente al reconstruir el historial.         |

---

### `WorkoutLog`

Registro de entrenamientos completados. Base de datos de progreso del usuario.

| Campo       | Tipo     | Nulable | Utilidad                                                                            |
|-------------|----------|---------|-------------------------------------------------------------------------------------|
| `id`        | String   | No      | PK.                                                                                 |
| `userId`    | String   | No      | FK → User.                                                                          |
| `date`      | DateTime | No      | Fecha del entrenamiento. Se usa para visualizar el calendario semanal del dashboard. |
| `exercises` | JSON     | No      | Array de ejercicios con series, reps y peso. Estructura: `[{ name, sets: [{ reps, weight }] }]`. Permite calcular volumen total y progresión de cargas. |
| `duration`  | Int      | Sí      | Duración en minutos. Se muestra en estadísticas del dashboard.                      |
| `completed` | Boolean  | No      | Indica si el entrenamiento se finalizó. Sirve para el cálculo de rachas (badge `consistency`). |
| `notes`     | String   | Sí      | Notas libres del usuario sobre el entrenamiento.                                    |
| `createdAt` | DateTime | No      | Timestamp de creación del registro.                                                 |

---

### `WeightLog`

Historial de peso corporal. Disponible solo en plan Premium (gráficas de progreso).

| Campo    | Tipo     | Nulable | Utilidad                                                               |
|----------|----------|---------|------------------------------------------------------------------------|
| `id`     | String   | No      | PK.                                                                    |
| `userId` | String   | No      | FK → User.                                                             |
| `weight` | Float    | No      | Peso en kg. Se grafica en el tiempo para mostrar la evolución corporal. |
| `date`   | DateTime | No      | Fecha de la medición. Permite visualizar tendencias semanales/mensuales.|

---

### `Achievement`

Sistema de gamificación. Registra qué insignias ha desbloqueado cada usuario.

| Campo        | Tipo     | Nulable | Utilidad                                                                           |
|--------------|----------|---------|------------------------------------------------------------------------------------|
| `id`         | String   | No      | PK.                                                                                |
| `userId`     | String   | No      | FK → User.                                                                         |
| `badge`      | Enum     | No      | Identificador del logro. Constraint único con `userId` — no se puede duplicar.     |
| `unlockedAt` | DateTime | No      | Fecha de desbloqueo. Se muestra en el perfil del usuario.                          |

**Badges disponibles:**

| Badge            | Se desbloquea cuando…                              |
|------------------|----------------------------------------------------|
| `first_step`     | El usuario completa el onboarding                  |
| `week_1`         | Han pasado 7 días desde el registro                |
| `consistency`    | El usuario entrena 5 días seguidos                 |
| `beast`          | Se supera un volumen alto de entrenamiento         |
| `committed`      | Han pasado 30 días desde el registro               |
| `weigher`        | Se registra el peso 5 veces o más                  |
| `nutritionist`   | Se genera un plan de nutrición                     |
| `social`         | El usuario se une a un grupo                       |
| `sharer`         | El usuario comparte un plan                        |
| `premium`        | El usuario activa el plan Premium                  |
| `challenge_done` | Se completa un reto                                |
| `group_top`      | El usuario llega al top de un grupo                |

---

### `DailyMessageCount`

Controla el límite de 5 mensajes/día para usuarios del plan free. Se actualiza con cada mensaje enviado.

| Campo    | Tipo     | Nulable | Utilidad                                                                                    |
|----------|----------|---------|---------------------------------------------------------------------------------------------|
| `id`     | String   | No      | PK.                                                                                         |
| `userId` | String   | No      | FK → User.                                                                                  |
| `date`   | DateTime | No      | Fecha truncada al día (UTC). Constraint único con `userId` — un registro por usuario/día.   |
| `count`  | Int      | No      | Mensajes enviados ese día. Si alcanza 5 (plan free), el backend bloquea el siguiente envío. |

---

## 4.3. Justificación del modelo de datos

### Fragmento de código: uso de variables de BD en el Prompt de IA

El `UserProfile` recuperado de la base de datos se inyecta en el prompt del sistema antes de cada llamada a la IA. La función `buildUserContext` (en `lib/prompts.ts`) construye una tabla Markdown con los datos del usuario, y la función `generatePlan` (en `lib/ai.ts`) lo ensambla como mensaje `system`:

```typescript
// lib/prompts.ts — serialización del UserProfile como contexto para la IA
function buildUserContext(p: UserProfile): string {
  const macros = calcMacros(p)   // proteínas, carbos, grasas calculados desde weight + goal
  const bmr    = calcBMR(p)      // fórmula Mifflin-St Jeor con age, weight, height, gender
  const tdee   = calcTDEE(p)     // BMR × factor de actividad según daysPerWeek
  const bmi    = (p.weight / (p.height / 100) ** 2).toFixed(1)

  return `### Perfil del usuario

| Campo       | Valor                          |
|-------------|-------------------------------|
| Edad        | ${p.age} años                 |
| Género      | ${GENDER_LABEL[p.gender]}     |
| Peso        | ${p.weight} kg                |
| Altura      | ${p.height} cm                |
| IMC         | ${bmi}                        |
| Objetivo    | ${GOAL_LABEL[p.goal]}         |
| Nivel       | ${LEVEL_LABEL[p.level]}       |
| Entrena     | ${p.daysPerWeek} días/semana  |
| Sesión      | ${p.sessionTime} min          |
| Equipamiento| ${WORKOUT_LABEL[p.workoutType]}|
| Horario     | ${SCHEDULE_LABEL[p.schedule]} |
| Lesiones    | ${p.injuries  ?? 'Ninguna'}   |
| Alergias    | ${p.allergies ?? 'Ninguna'}   |
| Dieta       | ${p.foodPreferences.join(', ') || 'Sin restricciones'} |
| Extra       | ${p.extraInfo ?? '—'}         |

**Calorías objetivo:** ${tdee} kcal/día  
**Macros:** Proteínas ${macros.protein}g · Carbos ${macros.carbs}g · Grasas ${macros.fat}g`
}

// lib/prompts.ts — ensambla el mensaje system completo
export function generarSystemPrompt(profile: UserProfile): string {
  return `Eres **FitCoach**, un entrenador personal y nutricionista deportivo de élite...

${buildUserContext(profile)}

Responde siempre en el idioma del usuario. Formatea con Markdown.`
}
```

```typescript
// lib/ai.ts — llamada a Groq con el perfil de BD como mensaje system
export async function generatePlan(profile: UserProfile): Promise<GeneratePlanResult> {
  const fullPlan = await callGroq([
    { role: 'system',  content: generarSystemPrompt(profile) },  // ← datos de UserProfile
    { role: 'user',    content: generarPromptCombinado(profile) },
  ])
  return parsePlanSections(fullPlan)
}
```

---

### Las 5 consultas SQL más importantes del negocio

#### 1. Verificar si un email ya está registrado (antes de crear cuenta)

Impide duplicados en el registro. Se ejecuta antes de cada `INSERT` de usuario.

```sql
SELECT id, email
FROM "User"
WHERE email = $1
LIMIT 1;
```

> Equivalente Prisma: `db.user.findUnique({ where: { email } })`

---

#### 2. Guardar o actualizar el perfil de onboarding (upsert)

Permite rellenar el perfil por primera vez y también actualizarlo desde `/profile`. El `ON CONFLICT` garantiza que nunca haya dos perfiles para el mismo usuario.

```sql
INSERT INTO "UserProfile" (
  "userId", age, weight, height, gender, goal, level,
  "daysPerWeek", "sessionTime", "workoutType", schedule,
  injuries, allergies, "foodPreferences", "extraInfo"
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT ("userId") DO UPDATE SET
  age            = EXCLUDED.age,
  weight         = EXCLUDED.weight,
  height         = EXCLUDED.height,
  gender         = EXCLUDED.gender,
  goal           = EXCLUDED.goal,
  level          = EXCLUDED.level,
  "daysPerWeek"  = EXCLUDED."daysPerWeek",
  "sessionTime"  = EXCLUDED."sessionTime",
  "workoutType"  = EXCLUDED."workoutType",
  schedule       = EXCLUDED.schedule,
  injuries       = EXCLUDED.injuries,
  allergies      = EXCLUDED.allergies,
  "foodPreferences" = EXCLUDED."foodPreferences",
  "extraInfo"    = EXCLUDED."extraInfo";
```

> Equivalente Prisma: `db.userProfile.upsert({ where: { userId }, update: {...}, create: {...} })`

---

#### 3. Listar los chats del usuario con su último mensaje

Se usa en la pantalla `/chat` para mostrar el historial de conversaciones ordenado por actividad reciente.

```sql
SELECT
  c.id,
  c.title,
  c."createdAt",
  c."updatedAt",
  COUNT(m.id)                                                        AS message_count,
  (
    SELECT content
    FROM   "Message"
    WHERE  "chatId" = c.id
      AND  role    != 'system'
    ORDER BY "createdAt" DESC
    LIMIT 1
  )                                                                  AS last_message
FROM  "Chat"    c
LEFT JOIN "Message" m ON m."chatId" = c.id
WHERE c."userId" = $1
GROUP BY c.id
ORDER BY c."updatedAt" DESC;
```

> Equivalente Prisma: `db.chat.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, select: { ..., _count: { select: { messages: true } }, messages: { where: { role: { not: 'system' } }, take: 1 } } })`

---

#### 4. Obtener un chat completo con todos sus mensajes (para la IA)

Se ejecuta antes de cada nueva respuesta de la IA para reconstruir el historial y enviarlo como contexto. Filtra los mensajes `system` de la UI pero los incluye al llamar a Groq.

```sql
SELECT
  c.id,
  c.title,
  c."createdAt",
  c."updatedAt",
  m.id          AS msg_id,
  m.role,
  m.content,
  m."createdAt" AS msg_created_at
FROM  "Chat"    c
LEFT JOIN "Message" m
  ON  m."chatId" = c.id
  AND m.role    != 'system'
WHERE c.id      = $1
  AND c."userId" = $2
ORDER BY m."createdAt" ASC;
```

> Equivalente Prisma: `db.chat.findFirst({ where: { id: chatId, userId }, select: { ..., messages: { where: { role: { not: 'system' } }, orderBy: { createdAt: 'asc' } } } })`

---

#### 5. Incrementar el contador diario de mensajes (rate limiting)

Se ejecuta con cada mensaje enviado por un usuario free. Si `count` llega a 5, el backend rechaza el siguiente mensaje con HTTP 429. El `ON CONFLICT` garantiza un único registro por usuario/día.

```sql
INSERT INTO "DailyMessageCount" ("userId", date, count)
VALUES ($1, CURRENT_DATE, 1)
ON CONFLICT ("userId", date)
DO UPDATE SET count = "DailyMessageCount".count + 1
RETURNING count;
```

> Equivalente Prisma: `db.dailyMessageCount.upsert({ where: { userId_date: { userId, date: todayUTC() } }, update: { count: { increment: 1 } }, create: { userId, date: todayUTC(), count: 1 } })`
