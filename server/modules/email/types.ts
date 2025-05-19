/**
 * Tipi per il modulo di gestione email
 */

// Interfaccia che mappa la struttura reale della tabella nel database
export interface EmailAccountDb {
  id: number;
  email: string;
  display_name?: string;
  imap_host?: string;
  imap_port?: number;
  imap_secure?: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  username?: string;
  password?: string;
  user_id?: number;
  is_primary?: boolean;
  is_active?: boolean;
  status?: string;
  last_sync_time?: Date;
  last_error?: string;
}

// Interfaccia per la configurazione IMAP utilizzata dal listener
export interface EmailAccount {
  id: number;
  email: string;
  displayName?: string;
  username: string;
  password: string;
  server: string;
  port: number;
  tls: boolean;
  isActive?: boolean;
  isPrimary?: boolean;
}

// Configurazione IMAP
export interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
  authTimeout: number;
  tlsOptions?: {
    rejectUnauthorized: boolean;
  };
}