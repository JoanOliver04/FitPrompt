import { logger } from '@/lib/logger'

/**
 * Sends an email-verification message.
 *
 * Stub: integrate Resend / SendGrid / SES here. Returns successfully even when
 * no provider is configured so the calling flow (register/onboarding) does not
 * leak whether sending succeeded.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const url = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`

  if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
    logger.info('email_provider_not_configured', { email, url })
    return
  }

  // TODO: provider-specific implementation. Example with Resend:
  //
  // const res = await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'FitPrompt <noreply@fitprompt.app>',
  //     to: [email],
  //     subject: 'Verifica tu cuenta de FitPrompt',
  //     html: `<p>Confirma tu correo:</p><a href="${url}">${url}</a>`,
  //   }),
  // })
  // if (!res.ok) throw new Error(`Email failed: ${res.status}`)

  logger.info('email_send_skipped_stub', { email })
}

export function emailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
}
