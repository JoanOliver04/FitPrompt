type LogCtx = Record<string, unknown>

const REDACT_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'cookie', 'apiKey'])

function redact(ctx: LogCtx): LogCtx {
  const out: LogCtx = {}
  for (const [k, v] of Object.entries(ctx)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]'
    } else if (v instanceof Error) {
      out[k] = { name: v.name, message: v.message, stack: v.stack }
    } else {
      out[k] = v
    }
  }
  return out
}

function emit(level: 'info' | 'warn' | 'error' | 'security', kind: string, ctx: LogCtx = {}): void {
  const line = { level, kind, ts: new Date().toISOString(), ...redact(ctx) }
  const json = JSON.stringify(line)
  if (level === 'error') console.error(json)
  else console.warn(json)   // 'info' / 'warn' / 'security' all map to warn — eslint only allows warn/error
}

export const logger = {
  info:     (kind: string, ctx?: LogCtx) => emit('info', kind, ctx),
  warn:     (kind: string, ctx?: LogCtx) => emit('warn', kind, ctx),
  error:    (kind: string, ctx?: LogCtx) => emit('error', kind, ctx),
  security: (kind: string, ctx?: LogCtx) => emit('security', kind, ctx),
}
