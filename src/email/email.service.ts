import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Initialize nodemailer transporter
    // You can configure this using environment variables
    // Support both existing SMTP_* envs and commonly used EMAIL_* envs (from plain Node setups)
    const smtpUser =
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('EMAIL_USERNAME') ||
      'tokaismaila@gmail.com';
    const smtpPass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('EMAIL_PASSWORD') ||
      'nrwg nhrw tzlt ugnu';

    // Port/secure defaults: 587 STARTTLS unless explicitly configured, or 465 when SECURE=true
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587');
    const smtpSecureEnv = this.configService.get<string>('SMTP_SECURE');
    // If SMTP_SECURE is provided, honor it. Otherwise infer from port (465 => secure).
    const smtpSecure = smtpSecureEnv ? smtpSecureEnv === 'true' : smtpPort === 465;
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpService = this.configService.get<string>('SMTP_SERVICE'); // e.g., 'gmail'
    const smtpDebug = this.configService.get<string>('SMTP_DEBUG') === 'true';
    // By default, keep TLS verification ON. Allow opt-out via env for dev/proxied networks.
    const smtpRejectUnauthorizedEnv = this.configService.get<string>('SMTP_REJECT_UNAUTHORIZED');
    const smtpRejectUnauthorized = smtpRejectUnauthorizedEnv
      ? smtpRejectUnauthorizedEnv === 'true'
      : true;
    const tlsOptions: Record<string, unknown> = {
      rejectUnauthorized: smtpRejectUnauthorized,
    };

    if (!smtpUser || !smtpPass) {
      console.warn('SMTP credentials not configured. Email functionality will not work.');
    }

    // Prefer using "service" when provided (e.g., Gmail) to let nodemailer handle host/port/secure.
    if (smtpService) {
      this.transporter = nodemailer.createTransport({
        service: smtpService,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        logger: smtpDebug,
        debug: smtpDebug,
        requireTLS: !smtpSecure,
        tls: tlsOptions,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure, // true for 465 (implicit TLS), false for STARTTLS (e.g., 587)
        auth: smtpUser && smtpPass ? {
          user: smtpUser,
          pass: smtpPass,
        } : undefined,
        logger: smtpDebug,
        debug: smtpDebug,
        requireTLS: !smtpSecure,
        tls: tlsOptions,
      });
    }

    // Proactively verify connection configuration and provide actionable logs without crashing app.
    this.transporter.verify()
      .then(() => {
        if (smtpDebug) {
          // eslint-disable-next-line no-console
          console.log('[EmailService] SMTP verify succeeded');
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[EmailService] SMTP verify failed:', err?.message || err);
      });
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const emailUsername = this.configService.get<string>('EMAIL_USERNAME');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    if (!(smtpUser && smtpPass) && !(emailUsername && emailPassword)) {
      throw new Error('SMTP credentials are not configured. Please set SMTP_USER/SMTP_PASS or EMAIL_USERNAME/EMAIL_PASSWORD environment variables.');
    }

    const mailOptions = {
      from:
        this.configService.get<string>('SMTP_FROM') ||
        this.configService.get<string>('FROM_EMAIL') ||
        smtpUser ||
        emailUsername ||
        '',
      to: email,
      subject: 'Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the code below to verify your email:</p>
          <div style="background-color: #ecf0f1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #2c3e50; letter-spacing: 5px; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #7f8c8d;">This code will expire in 5 minutes.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

  async sendEmailVerificationCode(email: string, code: string): Promise<void> {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const emailUsername = this.configService.get<string>('EMAIL_USERNAME');
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD');

    if (!(smtpUser && smtpPass) && !(emailUsername && emailPassword)) {
      throw new Error('SMTP credentials are not configured. Please set SMTP_USER/SMTP_PASS or EMAIL_USERNAME/EMAIL_PASSWORD environment variables.');
    }

    const mailOptions = {
      from:
        this.configService.get<string>('SMTP_FROM') ||
        this.configService.get<string>('FROM_EMAIL') ||
        smtpUser ||
        emailUsername ||
        '',
      to: email,
      subject: 'Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Email Verification</h2>
          <p>Thank you for registering! Please use the code below to verify your email address:</p>
          <div style="background-color: #ecf0f1; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #2c3e50; letter-spacing: 5px; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #7f8c8d;">This code will expire in 5 minutes.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

}

