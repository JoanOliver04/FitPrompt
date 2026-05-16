# Descripción de la Base de Datos — FitPrompt

**Motor:** PostgreSQL · **Alojamiento:** Supabase · **ORM:** Prisma v7 · **Conexión:** Connection pooling vía Supabase

---

## 4.1. Estructura de datos

El sistema está compuesto por **16 tablas** organizadas en torno al usuario central, agrupadas en cuatro dominios funcionales:

| Dominio | Tablas |
|---------|--------|
| **Identidad y acceso** | `User`, `UserProfile` |
| **Chat e IA** | `Chat`, `Message`, `DailyMessageCount`, `WeeklyCheckIn` |
| **Progreso físico** | `WorkoutLog`, `WeightLog`, `Streak` |
| **Gamificación** | `Achievement`, `UserXP`, `UserChallenge` |
| **Social** | `Follow`, `Group`, `GroupMember`, `Notification` |

### Tabla de tablas

| Tabla               | Propósito principal                                                   | Relación con `User` |
|---------------------|-----------------------------------------------------------------------|---------------------|
| `User`              | Identidad, autenticación, plan de suscripción y rol de admin          | Entidad raíz        |
| `UserProfile`       | Perfil físico y preferencias → alimenta el prompt de IA               | 1 : 1               |
| `Chat`              | Agrupador de conversaciones con la IA                                 | 1 : N               |
| `Message`           | Turnos de cada conversación (user / assistant / system)               | Chat → 1 : N        |
| `WorkoutLog`        | Entrenamientos registrados por el usuario                             | 1 : N               |
| `WeightLog`         | Historial de peso corporal para gráficas de progreso (Premium)        | 1 : N               |
| `Achievement`       | Insignias desbloqueadas (sistema de gamificación)                     | 1 : N               |
| `DailyMessageCount` | Contador de mensajes por día para rate-limiting del plan free          | 1 : N               |
| `Streak`            | Racha semanal — semanas consecutivas con entrenamiento completo       | 1 : 1               |
| `UserXP`            | Puntos de experiencia acumulados y nivel del usuario                  | 1 : 1               |
| `Follow`            | Relación de seguimiento entre usuarios (sistema social)               | N : N (autorreferencia) |
| `UserChallenge`     | Retos semanales aceptados y completados por el usuario               | 1 : N               |
| `Group`             | Grupos de entrenamiento creados por usuarios (Premium)                | 1 : N (creator)     |
| `GroupMember`       | Membresía de un usuario en un grupo                                   | 1 : N               |
| `Notification`      | Notificaciones del sistema (seguidor, invitación a grupo, rank)       | 1 : N               |
| `WeeklyCheckIn`     | Check-in semanal con respuesta de IA personalizada                    | 1 : N               |

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
  ├──── DailyMessageCount                  (1:N)
  │
  ├──── Streak                             (1:1)
  │
  ├──── UserXP                             (1:1)
  │
  ├──── UserChallenge                      (1:N)
  │
  ├──── WeeklyCheckIn                      (1:N)
  │
  ├──── Notification                       (1:N)
  │
  ├──── Follow [follower] ←→ Follow [following]  (N:N autorreferencia)
  │
  ├──── Group (creator)                    (1:N)
  │
  └──── GroupMember                        (1:N)

Group ──── GroupMember                     (1:N)
```

---

## 4.2. Descripción de las tablas

### `User`

Entidad central. Almacena la identidad del usuario, su nivel de acceso y su rol administrativo.

| Campo         | Tipo       | Nulable | Utilidad para la aplicación                                                                        |
|---------------|------------|---------|----------------------------------------------------------------------------------------------------|
| `id`          | String     | No      | Clave primaria (cuid). Se usa en cada query para aislar datos por usuario.                         |
| `email`       | String     | No      | Identificador único de login. Normalizado a minúsculas en registro.                                |
| `name`        | String     | Sí      | Se muestra en la cabecera del dashboard y en el saludo del chat.                                   |
| `image`       | String     | Sí      | URL de avatar procedente de Google OAuth.                                                          |
| `password`    | String     | Sí      | Hash bcrypt. Nulo si el usuario se registró por Google OAuth.                                      |
| `plan`        | Enum       | No      | `free` \| `premium`. **Todas las restricciones de acceso se validan contra este campo en el backend.** |
| `role`        | Enum       | No      | `USER` \| `ADMIN`. Los administradores omiten todos los límites de plan (bypass en `checkUserLimits`). |
| `lastLoginAt` | DateTime   | Sí      | Fecha del último login. Permite detectar usuarios inactivos y mostrar alertas de bienvenida.       |
| `createdAt`   | DateTime   | No      | Fecha de alta. Se usa para calcular el badge `week_1` y `committed`.                               |
| `updatedAt`   | DateTime   | No      | Actualizado automáticamente por Prisma en cada modificación.                                       |

---

### `UserProfile`

Perfil físico y de preferencias. Es **la tabla más crítica para la IA**: sus campos se serializan y se inyectan en cada prompt como contexto personalizado.

| Campo              | Tipo       | Nulable | Utilidad para la inteligencia de la aplicación                                                          |
|--------------------|------------|---------|---------------------------------------------------------------------------------------------------------|
| `userId`           | String     | No      | FK → User. Constraint único (relación 1:1).                                                             |
| `birthDate`        | DateTime   | No      | Fecha de nacimiento. La edad se calcula dinámicamente con `calculateAge(birthDate)` en cada prompt, garantizando que siempre sea correcta sin necesidad de actualizar el perfil. |
| `weight`           | Float      | No      | Peso en kg. Entra en el cálculo de macros (proteínas = peso × factor según objetivo).                  |
| `height`           | Float      | No      | Altura en cm. Usada en BMR, TDEE e IMC.                                                                 |
| `gender`           | Enum       | No      | `male` \| `female` \| `other`. Ajusta la fórmula de BMR (constante diferente por sexo).                |
| `goal`             | Enum       | No      | `volume` \| `definition` \| `maintenance` \| `weight_loss`. Determina el superávit/déficit calórico, los gramos de proteína por kg, y el estilo de entrenamiento generado por la IA. |
| `level`            | Enum       | No      | `beginner` \| `intermediate` \| `advanced`. La IA adapta la complejidad, el % 1RM, el RPE y el volumen propuesto. |
| `daysPerWeek`      | Int        | No      | Días de entrenamiento semanales. Determina el split de entrenamiento generado y el multiplicador de actividad del TDEE. |
| `sessionTime`      | String     | No      | `<30` \| `30-45` \| `45-60` \| `>60` min. Controla el número de ejercicios y series por sesión.        |
| `workoutType`      | Enum       | No      | `gym` \| `home` \| `bodyweight`. Filtra los ejercicios propuestos según equipamiento disponible.        |
| `schedule`         | Enum       | No      | `morning` \| `midday` \| `afternoon` \| `night`. Adapta el timing nutricional pre/post entreno en el prompt. |
| `injuries`         | String     | Sí      | Texto libre. La IA lo recibe como advertencia explícita (bloque ⚠️) para excluir ejercicios contraindicados. |
| `allergies`        | String     | Sí      | Texto libre. Excluye alimentos del plan nutricional generado con bloqueo absoluto.                      |
| `foodPreferences`  | String[]   | No      | Lista de preferencias (vegano, sin gluten…). Determina el enfoque dietético del plan.                  |
| `extraInfo`        | String     | Sí      | Campo libre para cualquier restricción o preferencia adicional que no encaja en los enums.              |
| `createdAt`        | DateTime   | No      | Timestamp de creación del perfil.                                                                       |
| `updatedAt`        | DateTime   | No      | Actualizado automáticamente por Prisma.                                                                 |

---

### `Chat`

Contenedor de una sesión de conversación. Permite múltiples conversaciones independientes (limitadas a 3 en plan free).

| Campo       | Tipo     | Nulable | Utilidad                                                                          |
|-------------|----------|---------|-----------------------------------------------------------------------------------|
| `id`        | String   | No      | PK. Se usa para verificar la propiedad del chat antes de leer/borrar mensajes.    |
| `userId`    | String   | No      | FK → User. Garantiza aislamiento: un usuario solo accede a sus propios chats.     |
| `title`     | String   | No      | Generado a partir del primer mensaje. Se muestra en el listado de chats.          |
| `createdAt` | DateTime | No      | Fecha de creación.                                                                |
| `updatedAt` | DateTime | No      | Se actualiza al guardar un nuevo mensaje, para ordenar chats por actividad reciente. |

---

### `Message`

Cada turno de la conversación. Se almacena el historial completo para enviarlo a la API de IA y mantener el contexto.

| Campo       | Tipo     | Nulable | Utilidad                                                                                     |
|-------------|----------|---------|----------------------------------------------------------------------------------------------|
| `id`        | String   | No      | PK.                                                                                          |
| `chatId`    | String   | No      | FK → Chat (cascade delete).                                                                  |
| `role`      | Enum     | No      | `user` \| `assistant` \| `system`. El rol `system` se filtra en la UI pero se envía a Groq para mantener el contexto del perfil. |
| `content`   | String   | No      | Texto del mensaje (almacenado como `@db.Text`). Puede contener Markdown.                     |
| `createdAt` | DateTime | No      | Timestamp para ordenar mensajes cronológicamente al reconstruir el historial.                |

---

### `WorkoutLog`

Registro de entrenamientos completados. Base de datos de progreso físico.

| Campo       | Tipo     | Nulable | Utilidad                                                                                 |
|-------------|----------|---------|------------------------------------------------------------------------------------------|
| `id`        | String   | No      | PK.                                                                                      |
| `userId`    | String   | No      | FK → User.                                                                               |
| `date`      | DateTime | No      | Fecha del entrenamiento. Se usa para el calendario semanal del dashboard.                |
| `exercises` | JSON     | No      | Array de ejercicios con series, reps y peso. Estructura: `[{ name, sets: [{ reps, weight }] }]`. Permite calcular volumen total y progresión de cargas. |
| `duration`  | Int      | No      | Duración en minutos (obligatorio). Se muestra en estadísticas del dashboard.             |
| `completed` | Boolean  | No      | Indica si el entrenamiento se finalizó. **Clave para el cálculo de rachas y streaks.**   |
| `notes`     | String   | Sí      | Notas libres del usuario sobre el entrenamiento.                                         |
| `createdAt` | DateTime | No      | Timestamp de creación del registro.                                                      |

---

### `WeightLog`

Historial de peso corporal. Disponible solo en plan Premium (gráficas de progreso).

| Campo    | Tipo     | Nulable | Utilidad                                                                |
|----------|----------|---------|-------------------------------------------------------------------------|
| `id`     | String   | No      | PK.                                                                     |
| `userId` | String   | No      | FK → User.                                                              |
| `weight` | Float    | No      | Peso en kg. Se grafica en el tiempo para mostrar la evolución corporal. |
| `date`   | DateTime | No      | Fecha de la medición. Permite visualizar tendencias semanales/mensuales.|

---

### `Achievement`

Sistema de gamificación. Registra qué insignias ha desbloqueado cada usuario. Idempotente por diseño: el constraint `@@unique([userId, badge])` impide duplicados.

| Campo        | Tipo     | Nulable | Utilidad                                                                      |
|--------------|----------|---------|-------------------------------------------------------------------------------|
| `id`         | String   | No      | PK.                                                                           |
| `userId`     | String   | No      | FK → User.                                                                    |
| `badge`      | Enum     | No      | Identificador del logro (`BadgeId`). Constraint único con `userId`.           |
| `unlockedAt` | DateTime | No      | Fecha de desbloqueo. Se muestra en el perfil del usuario.                     |

**Badges disponibles y criterios de desbloqueo:**

| Badge            | Se desbloquea cuando…                                         | Plan        |
|------------------|---------------------------------------------------------------|-------------|
| `first_step`     | El usuario completa el onboarding                             | Free        |
| `week_1`         | El usuario completa su primera semana de entrenamientos       | Free        |
| `consistency`    | El usuario entrena 7 días seguidos                            | Free        |
| `weigher`        | El usuario registra su peso 7 días seguidos                   | Free        |
| `beast`          | Se supera un volumen alto de entrenamiento                    | Premium     |
| `committed`      | Han pasado 30 días desde el registro                          | Premium     |
| `nutritionist`   | Se genera un plan de nutrición                                | Premium     |
| `social`         | El usuario se une a un grupo                                  | Premium     |
| `sharer`         | El usuario comparte un plan                                   | Premium     |
| `premium`        | El usuario activa el plan Premium                             | Premium     |
| `challenge_done` | Se completa un reto semanal                                   | Premium     |
| `group_top`      | El usuario llega al top de un grupo                           | Premium     |

---

### `DailyMessageCount`

Controla el límite de 5 mensajes/día para usuarios del plan free.

| Campo    | Tipo     | Nulable | Utilidad                                                                                      |
|----------|----------|---------|---------------------------------------------------------------------------------------------|
| `id`     | String   | No      | PK.                                                                                          |
| `userId` | String   | No      | FK → User.                                                                                   |
| `date`   | DateTime | No      | Fecha truncada al día (`@db.Date`). Constraint único con `userId` — un registro por usuario/día. |
| `count`  | Int      | No      | Mensajes enviados ese día. Si alcanza 5 (plan free), el backend rechaza el siguiente envío con HTTP 429. |

---

### `Streak`

Racha de consistencia semanal. Registra cuántas semanas consecutivas el usuario ha completado todos sus entrenamientos planificados (`daysPerWeek`). Usa semanas ISO (`YYYY-Www`) para un conteo sin ambigüedades.

| Campo               | Tipo     | Nulable | Utilidad                                                                                        |
|---------------------|----------|---------|-------------------------------------------------------------------------------------------------|
| `id`                | String   | No      | PK.                                                                                             |
| `userId`            | String   | No      | FK → User. Constraint único (1:1).                                                              |
| `currentStreak`     | Int      | No      | Semanas consecutivas activas. Se reinicia a 0 si el usuario salta una semana entera.            |
| `bestStreak`        | Int      | No      | Máxima racha histórica del usuario. Nunca decrece.                                              |
| `lastCompletedWeek` | String   | Sí      | Última semana ISO completada (`"2025-W20"`). Usado para detectar continuidad o ruptura de racha.|
| `updatedAt`         | DateTime | No      | Actualizado automáticamente por Prisma.                                                         |

---

### `UserXP`

Puntos de experiencia acumulados. Alimentan el sistema de niveles (10 niveles: Novato → Superman).

| Campo     | Tipo   | Nulable | Utilidad                                                                                 |
|-----------|--------|---------|------------------------------------------------------------------------------------------|
| `id`      | String | No      | PK.                                                                                      |
| `userId`  | String | No      | FK → User. Constraint único (1:1).                                                       |
| `totalXP` | Int    | No      | XP total acumulado. La función `deriveLevel(totalXP)` calcula el nivel y la barra de progreso sin persistir campos derivados. |

**Tabla de recompensas XP:**

| Acción              | XP ganados |
|---------------------|------------|
| Entrenamiento completado | +50   |
| Registro de peso    | +10        |
| Semana completa     | +200       |

**Tabla de niveles:**

| Nivel | Nombre      | XP requerido |
|-------|-------------|-------------|
| 1     | Novato      | 0           |
| 2     | Activo      | 300         |
| 3     | Consistente | 700         |
| 4     | Atleta      | 1 500       |
| 5     | Guerrero    | 3 000       |
| 6     | Élite       | 6 000       |
| 7     | Culturista  | 12 000      |
| 8     | Olimpia     | 24 000      |
| 9     | Hulk        | 48 000      |
| 10    | Superman    | 96 000      |

---

### `Follow`

Relación social de seguimiento entre usuarios (muchos a muchos autorelacionada). Base del sistema social de grupos y rankings.

| Campo        | Tipo     | Nulable | Utilidad                                                                              |
|--------------|----------|---------|---------------------------------------------------------------------------------------|
| `id`         | String   | No      | PK.                                                                                   |
| `followerId` | String   | No      | FK → User. El usuario que sigue. Indexado para queries de "a quién sigo".             |
| `followingId`| String   | No      | FK → User. El usuario seguido. Indexado para queries de "quién me sigue".             |
| `createdAt`  | DateTime | No      | Fecha del seguimiento. Constraint único `[followerId, followingId]` — no hay duplicados.|

---

### `UserChallenge`

Retos semanales que el usuario acepta y puede completar. Un reto se identifica por `challengeId` (clave string definida en el frontend) y la semana de inicio (`weekStart`).

| Campo         | Tipo     | Nulable | Utilidad                                                                              |
|---------------|----------|---------|---------------------------------------------------------------------------------------|
| `id`          | String   | No      | PK.                                                                                   |
| `userId`      | String   | No      | FK → User.                                                                            |
| `challengeId` | String   | No      | Identificador del reto (ej. `"run_5k"`). Definido en el catálogo del frontend.        |
| `weekStart`   | DateTime | No      | Lunes de la semana del reto (`@db.Date`). Constraint único `[userId, challengeId, weekStart]`. |
| `completed`   | Boolean  | No      | Si el reto fue completado esta semana.                                                |
| `completedAt` | DateTime | Sí      | Timestamp de completado, para mostrar en el historial.                                |
| `createdAt`   | DateTime | No      | Timestamp de aceptación del reto.                                                     |

---

### `Group`

Grupos de entrenamiento entre usuarios. Funcionalidad exclusiva del plan Premium.

| Campo       | Tipo     | Nulable | Utilidad                                                                            |
|-------------|----------|---------|-------------------------------------------------------------------------------------|
| `id`        | String   | No      | PK.                                                                                 |
| `name`      | String   | No      | Nombre del grupo. Se muestra en listados y notificaciones de invitación.            |
| `createdBy` | String   | No      | FK → User. El creador del grupo también es miembro implícito.                       |
| `createdAt` | DateTime | No      | Fecha de creación.                                                                  |

---

### `GroupMember`

Membresía de un usuario en un grupo. Constraint único `[groupId, userId]` evita dobles registros.

| Campo      | Tipo     | Nulable | Utilidad                                                            |
|------------|----------|---------|---------------------------------------------------------------------|
| `id`       | String   | No      | PK.                                                                 |
| `groupId`  | String   | No      | FK → Group. Indexado para queries de "miembros de un grupo".        |
| `userId`   | String   | No      | FK → User. Indexado para queries de "grupos de un usuario".         |
| `joinedAt` | DateTime | No      | Fecha de unión al grupo.                                            |

---

### `Notification`

Notificaciones del sistema enviadas a un usuario. Tiene índices compuestos para leer rápido las notificaciones no leídas y las más recientes.

| Campo        | Tipo     | Nulable | Utilidad                                                                                  |
|--------------|----------|---------|-------------------------------------------------------------------------------------------|
| `id`         | String   | No      | PK.                                                                                       |
| `userId`     | String   | No      | FK → User destinatario.                                                                   |
| `type`       | Enum     | No      | `new_follower` \| `group_invite` \| `rank_surpassed`. Determina el icono y la acción en la UI. |
| `title`      | String   | No      | Texto principal de la notificación (ej. "Alguien ha empezado a seguirte").                |
| `body`       | String   | Sí      | Texto secundario opcional (ej. "Únete para entrenar en equipo").                          |
| `href`       | String   | Sí      | Ruta interna a la que redirige al pulsar la notificación (ej. `/groups/abc123`).          |
| `fromUserId` | String   | Sí      | FK opcional al usuario que originó la notificación. Usado para deduplicar `new_follower`. |
| `read`       | Boolean  | No      | Si el usuario ya ha visto la notificación. Indexado junto con `userId` para el contador de no leídas. |
| `createdAt`  | DateTime | No      | Timestamp. Indexado junto con `userId` para ordenar por recencia.                         |

---

### `WeeklyCheckIn`

Check-in semanal del usuario sobre su estado físico y mental. La IA (Groq) analiza la respuesta y genera 3 sugerencias personalizadas que se guardan en `aiSuggestions`. Constraint único por `[userId, weekStart]` — un check-in por usuario por semana.

| Campo           | Tipo     | Nulable | Utilidad                                                                                       |
|-----------------|----------|---------|------------------------------------------------------------------------------------------------|
| `id`            | String   | No      | PK.                                                                                            |
| `userId`        | String   | No      | FK → User.                                                                                     |
| `weekStart`     | DateTime | No      | Lunes de la semana (`@db.Date`). Constraint único con `userId`.                                |
| `response`      | String   | No      | Texto libre del usuario describiendo su semana (`@db.Text`).                                   |
| `aiSuggestions` | String   | Sí      | JSON serializado: array de 3 strings con sugerencias generadas por Groq (`@db.Text`).          |
| `createdAt`     | DateTime | No      | Timestamp de creación.                                                                         |
| `updatedAt`     | DateTime | No      | Actualizado automáticamente por Prisma.                                                        |

---

## 4.3. Justificación del modelo de datos

### Prueba técnica de la conexión

La conexión a la base de datos PostgreSQL alojada en Supabase se realiza mediante **Prisma v7 con driver adapter** (`@prisma/adapter-pg`). Este enfoque delega la gestión del pool de conexiones a la librería `pg` de Node.js en lugar de al motor binario de Prisma, lo que es el modelo recomendado para entornos serverless (Vercel + Supabase).

**Variable de entorno (`.env.local`):**

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

El parámetro `pgbouncer=true` activa el modo compatible con PgBouncer de Supabase (connection pooling en modo Transaction). El `connection_limit=1` es obligatorio en entornos serverless para evitar el agotamiento del pool.

**Configuración en `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  // La URL se inyecta en tiempo de ejecución a través del adapter (lib/db.ts),
  // no como campo url/directUrl, que es el patrón de Prisma v7 con driver adapters.
}
```

**Inicialización del cliente (`lib/db.ts`):**

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
```

El patrón **singleton con `globalThis`** evita que Next.js abra múltiples instancias de Prisma durante el hot-reload en desarrollo (cada vez que se recarga un módulo, `createPrismaClient` solo se ejecuta si `globalForPrisma.prisma` todavía no existe). En producción se crea una única instancia por proceso de servidor.

El cliente exportado se llama `db` (no `prisma`) y es el único punto de acceso a la base de datos en todo el proyecto:

```typescript
import { db } from '@/lib/db'

// Ejemplo de uso en cualquier API Route o Server Component:
const user = await db.user.findUnique({ where: { id: session.user.id } })
```

---

### Fragmento de código: uso de variables de BD en el Prompt de IA

El `UserProfile` recuperado de la base de datos se inyecta en el prompt del sistema antes de cada llamada a la IA. La función `buildUserContext` (en `lib/prompts.ts`) construye dos tablas Markdown — una con los datos del perfil y otra con los datos metabólicos calculados — y la función `generarSystemPrompt` los ensambla como mensaje `system` para Groq:

```typescript
// lib/prompts.ts — serialización del UserProfile como contexto para la IA
function buildUserContext(p: UserProfile): string {
  const macros  = calcMacros(p)    // calorías, proteínas, carbos, grasas según weight + goal
  const bmr     = calcBMR(p)       // Mifflin-St Jeor con calculateAge(birthDate), weight, height, gender
  const tdee    = calcTDEE(p)      // BMR × multiplicador de actividad según daysPerWeek
  const bmi     = (p.weight / (p.height / 100) ** 2).toFixed(1)
  const mult    = activityMultiplier(p.daysPerWeek)

  // Solo se añaden las filas opcionales si el campo tiene contenido
  const optionalProfileRows = [
    p.injuries         ? `| ⚠️ Lesiones / limitaciones  | ${p.injuries} |` : null,
    p.allergies        ? `| ⚠️ Alergias / intolerancias  | ${p.allergies} |` : null,
    p.foodPreferences.length > 0
                       ? `| Preferencias alimentarias   | ${p.foodPreferences.join(', ')} |` : null,
    p.extraInfo        ? `| Información adicional       | ${p.extraInfo} |` : null,
  ].filter(Boolean).join('\n')

  return `### Perfil del usuario

| Campo | Valor |
|---|---|
| Edad | ${calculateAge(p.birthDate)} años |      ← calculada en tiempo real desde birthDate
| Género | ${GENDER_LABEL[p.gender]} |
| Peso | ${p.weight} kg |
| Altura | ${p.height} cm |
| IMC | ${bmi} |
| Objetivo | ${GOAL_LABEL[p.goal]} |
| Nivel | ${LEVEL_LABEL[p.level]} |
| Días de entrenamiento | ${p.daysPerWeek} días/semana |
| Duración por sesión | ${SESSION_TIME_LABEL[p.sessionTime]} |
| Equipamiento | ${WORKOUT_EQUIPMENT[p.workoutType]} |
| Horario preferido | ${SCHEDULE_LABEL[p.schedule]} |
${optionalProfileRows}

### Datos metabólicos (Mifflin-St Jeor)

| Métrica | Valor |
|---|---|
| TMB (metabolismo basal) | ${bmr} kcal/día |
| TDEE (gasto total diario) | ${tdee} kcal/día (mult. actividad: ${mult}×) |
| Calorías objetivo | ${macros.calories} kcal/día |
| Proteína objetivo | ${macros.protein} g/día |
| Carbohidratos objetivo | ${macros.carbs} g/día |
| Grasa objetivo | ${macros.fat} g/día |`
}

// lib/prompts.ts — ensambla el mensaje system completo
export function generarSystemPrompt(profile: UserProfile): string {
  return `Eres FitCoach, un entrenador personal y nutricionista deportivo de élite...

${buildUserContext(profile)}

Personalización absoluta: cada respuesta debe reflejar los datos de este usuario
(${calculateAge(profile.birthDate)} años, ${profile.weight} kg, objetivo: ${GOAL_LABEL[profile.goal]}, nivel: ${LEVEL_LABEL[profile.level]})`
}
```

```typescript
// lib/ai.ts — llamada a Groq con el perfil de BD como mensaje system
export async function generatePlan(profile: UserProfile): Promise<GeneratePlanResult> {
  const fullPlan = await callGroq([
    { role: 'system', content: generarSystemPrompt(profile) },    // ← datos de UserProfile
    { role: 'user',   content: generarPromptCombinado(profile) }, // ← plan 4 semanas con macros
  ])
  return parsePlanSections(fullPlan)  // divide la respuesta en 5 partes (rutina, dieta, recuperación, hoja de ruta, FAQ)
}
```

Además de `generatePlan`, existen cuatro prompts especializados que también se nutren de `UserProfile`:

| Función exportada          | Genera                                      | Usa de la BD                                    |
|----------------------------|---------------------------------------------|-------------------------------------------------|
| `generarSystemPrompt`      | Persona de FitCoach + contexto del usuario  | Todo el perfil + cálculos metabólicos           |
| `generarPromptRutina`      | Rutina semanal detallada                    | goal, level, daysPerWeek, sessionTime, workoutType, injuries |
| `generarPromptDieta`       | Plan de alimentación diario con gramajes    | goal, weight, allergies, foodPreferences, schedule |
| `generarPromptListaCompra` | Lista de la compra semanal (JSON)           | goal, macros, allergies, foodPreferences        |
| `generarPromptCombinado`   | Plan integral 4 semanas (5 partes)          | Todo el perfil                                  |

---

### Las 8 consultas SQL más importantes del negocio

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
  "userId", "birthDate", weight, height, gender, goal, level,
  "daysPerWeek", "sessionTime", "workoutType", schedule,
  injuries, allergies, "foodPreferences", "extraInfo"
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
ON CONFLICT ("userId") DO UPDATE SET
  "birthDate"       = EXCLUDED."birthDate",
  weight            = EXCLUDED.weight,
  height            = EXCLUDED.height,
  gender            = EXCLUDED.gender,
  goal              = EXCLUDED.goal,
  level             = EXCLUDED.level,
  "daysPerWeek"     = EXCLUDED."daysPerWeek",
  "sessionTime"     = EXCLUDED."sessionTime",
  "workoutType"     = EXCLUDED."workoutType",
  schedule          = EXCLUDED.schedule,
  injuries          = EXCLUDED.injuries,
  allergies         = EXCLUDED.allergies,
  "foodPreferences" = EXCLUDED."foodPreferences",
  "extraInfo"       = EXCLUDED."extraInfo";
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

Se ejecuta antes de cada nueva respuesta de la IA para reconstruir el historial y enviarlo como contexto.

```sql
SELECT
  c.id,
  c.title,
  m.id          AS msg_id,
  m.role,
  m.content,
  m."createdAt" AS msg_created_at
FROM  "Chat"    c
LEFT JOIN "Message" m
  ON  m."chatId" = c.id
WHERE c.id      = $1
  AND c."userId" = $2
ORDER BY m."createdAt" ASC;
```

> Equivalente Prisma: `db.chat.findFirst({ where: { id: chatId, userId }, select: { ..., messages: { orderBy: { createdAt: 'asc' } } } })`

---

#### 5. Incrementar el contador diario de mensajes (rate limiting)

Se ejecuta con cada mensaje enviado por un usuario free. Si `count` llega a 5, el backend rechaza el siguiente mensaje con HTTP 429.

```sql
INSERT INTO "DailyMessageCount" ("userId", date, count)
VALUES ($1, CURRENT_DATE, 1)
ON CONFLICT ("userId", date)
DO UPDATE SET count = "DailyMessageCount".count + 1
RETURNING count;
```

> Equivalente Prisma: `db.dailyMessageCount.upsert({ where: { userId_date: { userId, date: todayUTC() } }, update: { count: { increment: 1 } }, create: { userId, date: todayUTC(), count: 1 } })`

---

#### 6. Actualizar el streak semanal del usuario

Se ejecuta después de guardar un entrenamiento completado. Comprueba si el usuario ha alcanzado `daysPerWeek` entrenamientos en la semana actual y, si es así, incrementa la racha. Idempotente: si `lastCompletedWeek` ya es la semana actual, no hace nada.

```sql
-- Paso 1: contar entrenamientos completados en la semana actual
SELECT COUNT(*) AS completed_this_week
FROM "WorkoutLog"
WHERE "userId"   = $1
  AND completed  = true
  AND date      >= date_trunc('week', now())
  AND date       < date_trunc('week', now()) + interval '7 days';

-- Paso 2 (si completed_this_week >= daysPerWeek): upsert de la racha
INSERT INTO "Streak" ("userId", "currentStreak", "bestStreak", "lastCompletedWeek", "updatedAt")
VALUES ($1, 1, 1, $2, now())
ON CONFLICT ("userId") DO UPDATE SET
  "currentStreak"     = CASE
                          WHEN "Streak"."lastCompletedWeek" = $3  -- prev ISO week
                          THEN "Streak"."currentStreak" + 1
                          ELSE 1
                        END,
  "bestStreak"        = GREATEST("Streak"."bestStreak",
                          CASE WHEN "Streak"."lastCompletedWeek" = $3
                               THEN "Streak"."currentStreak" + 1
                               ELSE 1 END),
  "lastCompletedWeek" = $2,
  "updatedAt"         = now();
```

> Equivalente Prisma: `db.streak.upsert({ where: { userId }, update: { currentStreak: newCurrent, bestStreak: newBest, lastCompletedWeek: currentWeek }, create: { userId, currentStreak: 1, bestStreak: 1, lastCompletedWeek: currentWeek } })`

---

#### 7. Añadir XP al usuario y detectar subida de nivel

Se ejecuta en paralelo con el upsert de streak tras un entrenamiento o registro de peso. Devuelve el XP total actualizado para que la capa de aplicación (`deriveLevel`) calcule si hay level-up.

```sql
INSERT INTO "UserXP" ("userId", "totalXP")
VALUES ($1, $2)
ON CONFLICT ("userId")
DO UPDATE SET "totalXP" = "UserXP"."totalXP" + $2
RETURNING "totalXP";
```

> Equivalente Prisma: `db.userXP.upsert({ where: { userId }, create: { userId, totalXP: amount }, update: { totalXP: { increment: amount } } })`

---

#### 8. Guardar o actualizar el check-in semanal con sugerencias de IA

Se ejecuta en dos pasos: primero se guarda la respuesta del usuario, luego se llama a Groq y se actualiza el registro con las sugerencias generadas. El constraint `@@unique([userId, weekStart])` garantiza un único check-in por semana.

```sql
-- Paso 1: guardar respuesta del usuario
INSERT INTO "WeeklyCheckIn" ("userId", "weekStart", response, "createdAt", "updatedAt")
VALUES ($1, date_trunc('week', now()), $2, now(), now())
ON CONFLICT ("userId", "weekStart")
DO UPDATE SET response = EXCLUDED.response, "updatedAt" = now()
RETURNING id;

-- Paso 2: actualizar con sugerencias de IA (tras llamada a Groq)
UPDATE "WeeklyCheckIn"
SET "aiSuggestions" = $2,   -- JSON array serializado de 3 strings
    "updatedAt"     = now()
WHERE id = $1;
```

> Equivalente Prisma: `db.weeklyCheckIn.upsert({ where: { userId_weekStart: { userId, weekStart } }, create: { userId, weekStart, response }, update: { response } })` + `db.weeklyCheckIn.update({ where: { id }, data: { aiSuggestions: JSON.stringify(suggestions) } })`
