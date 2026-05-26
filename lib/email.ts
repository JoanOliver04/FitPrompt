import { logger } from '@/lib/logger'

// ─── HTML templates ───────────────────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#101010;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#101010;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#FF471A;padding:24px 32px;">
          <p style="margin:0;font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">⚡ FitPrompt</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#fff;">${title}</h1>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #2a2a2a;">
          <p style="margin:0;font-size:12px;color:#555;line-height:1.5;">
            Si no solicitaste esto, ignora este mensaje. Tu cuenta está segura.<br>
            © 2025 FitPrompt — Tu entrenador IA
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function resetPasswordHtml(url: string): string {
  return baseTemplate(
    'Restablece tu contraseña',
    `<p style="margin:0 0 24px;font-size:15px;color:#ccc;line-height:1.6;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña.
    </p>
    <a href="${url}" style="display:inline-block;background:#FF471A;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
      Restablecer contraseña
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.5;">
      Este enlace caduca en <strong style="color:#888;">1 hora</strong>.<br>
      Si el botón no funciona, copia este enlace en tu navegador:<br>
      <a href="${url}" style="color:#FF471A;word-break:break-all;">${url}</a>
    </p>`,
  )
}

function verifyEmailHtml(url: string): string {
  return baseTemplate(
    'Verifica tu cuenta',
    `<p style="margin:0 0 24px;font-size:15px;color:#ccc;line-height:1.6;">
      Gracias por registrarte en FitPrompt. Haz clic en el botón de abajo para verificar tu dirección de email y activar tu cuenta.
    </p>
    <a href="${url}" style="display:inline-block;background:#FF471A;color:#fff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
      Verificar email
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.5;">
      Si no creaste una cuenta en FitPrompt, ignora este mensaje.
    </p>`,
  )
}

// ─── Resend sender ────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // caller already logged the fallback

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    'FitPrompt <noreply@fitprompt.app>',
      to:      [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const url  = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`

  if (!process.env.RESEND_API_KEY) {
    logger.info('email_provider_not_configured', { email, url })
    return
  }

  try {
    await sendEmail(email, 'Verifica tu cuenta de FitPrompt', verifyEmailHtml(url))
    logger.info('verification_email_sent', { email })
  } catch (err) {
    logger.error('verification_email_failed', { email, err })
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const url  = `${base}/reset-password?token=${encodeURIComponent(token)}`

  if (!process.env.RESEND_API_KEY) {
    logger.info('password_reset_email_not_configured', { email, resetUrl: url })
    return
  }

  try {
    await sendEmail(email, 'Restablece tu contraseña de FitPrompt', resetPasswordHtml(url))
    logger.info('password_reset_email_sent', { email })
  } catch (err) {
    logger.error('password_reset_email_failed', { email, err })
  }
}

export function emailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
}
