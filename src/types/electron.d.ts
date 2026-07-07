interface EmailCredentials {
  smtpPassword: string;
  imapPassword?: string;
}

interface Window {
  electronAPI?: {
    invoke(channel: 'store-refresh-token', token: string): Promise<void>;
    invoke(channel: 'get-refresh-token'): Promise<string | null>;
    invoke(channel: 'clear-refresh-token'): Promise<void>;
    invoke(
      channel: 'store-email-credentials',
      accountId: string,
      smtpPassword: string,
      imapPassword?: string,
    ): Promise<void>;
    invoke(channel: 'get-email-credentials', accountId: string): Promise<EmailCredentials | null>;
    invoke(channel: 'clear-email-credentials', accountId: string): Promise<void>;
  };
}
