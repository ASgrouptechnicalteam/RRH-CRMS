export interface EmailProvider {
  sendVerificationEmail(input: {
    email: string;
    name?: string;
    verificationUrl: string;
  }): Promise<void>;

  sendPasswordResetEmail(input: { email: string; name?: string; resetUrl: string }): Promise<void>;
}

export class DevelopmentEmailProvider implements EmailProvider {
  async sendVerificationEmail({
    email,
    verificationUrl,
  }: {
    email: string;
    verificationUrl: string;
  }): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DevelopmentEmailProvider is active in production environment!');
    }

    // In local development, we print the URL so the developer can click it.
    // We intentionally do NOT log the raw token itself, but only the full URL the user would click.
    console.log('\n================ DEVELOPMENT EMAIL ================');
    console.log(`[Email Verification] To: ${email}`);
    console.log(`[Email Verification] Link: ${verificationUrl}`);
    console.log('=====================================================\n');
  }

  async sendPasswordResetEmail({
    email,
    resetUrl,
  }: {
    email: string;
    resetUrl: string;
  }): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DevelopmentEmailProvider is active in production environment!');
    }

    console.log('\n================ DEVELOPMENT EMAIL ================');
    console.log(`[Password Reset] To: ${email}`);
    console.log(`[Password Reset] Link: ${resetUrl}`);
    console.log('=====================================================\n');
  }
}

// Ensure the email provider does not resolve dynamically in production without an explicit check
export const emailProvider: EmailProvider =
  process.env.EMAIL_PROVIDER === 'development'
    ? new DevelopmentEmailProvider()
    : new DevelopmentEmailProvider(); // Fallback for now until production provider is added
