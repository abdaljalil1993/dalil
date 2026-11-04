import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
};

export class MailService {
  /** Returns true if the mail was actually sent. Without SMTP config the content is logged (dev). */
  static async send(to: string, subject: string, html: string): Promise<boolean> {
    const t = getTransporter();
    if (!t) {
      logger.info(`[Mail:dev] To: ${to} | ${subject}\n${html.replace(/<[^>]+>/g, ' ')}`);
      return false;
    }
    try {
      await t.sendMail({ from: env.smtp.from, to, subject, html });
      return true;
    } catch (err) {
      logger.error('[Mail] send failed', { error: (err as Error).message });
      return false;
    }
  }
}
