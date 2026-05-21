export class PayloadTooLargeError extends Error {
  constructor(public maxBytes: number) {
    super(`Payload exceeds ${maxBytes} bytes`)
    this.name = 'PayloadTooLargeError'
  }
}

export class InvalidContentTypeError extends Error {
  constructor(actual: string | null) {
    super(`Content-Type must be application/json, got "${actual ?? '(missing)'}"`)
    this.name = 'InvalidContentTypeError'
  }
}

/**
 * Streaming JSON reader with a hard byte cap.
 * Use this in every route handler that calls `req.json()`.
 *
 *   const body = await readJson<MyShape>(req, 32 * 1024)
 */
export async function readJson<T = unknown>(req: Request, maxBytes = 64 * 1024): Promise<T> {
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.toLowerCase().startsWith('application/json')) {
    throw new InvalidContentTypeError(ct || null)
  }
  const len = req.headers.get('content-length')
  if (len && Number(len) > maxBytes) {
    throw new PayloadTooLargeError(maxBytes)
  }

  const reader = req.body?.getReader()
  if (!reader) return JSON.parse('{}') as T

  const chunks: Uint8Array[] = []
  let received = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new PayloadTooLargeError(maxBytes)
    }
    chunks.push(value)
  }

  const buf = new Uint8Array(received)
  let off = 0
  for (const c of chunks) { buf.set(c, off); off += c.byteLength }
  if (received === 0) return JSON.parse('{}') as T
  return JSON.parse(new TextDecoder().decode(buf)) as T
}
