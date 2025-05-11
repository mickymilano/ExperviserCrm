import * as Imap from 'imap';
import { createTransport } from 'nodemailer';
import { EmailAccount, InsertEmail, Email } from '@shared/schema';
import { storage } from '../storage';
import { Readable } from 'stream';
import util from 'util';

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  }
}

// Helper function to convert stream to string
function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

export class EmailService {
  private emailAccounts: Map<number, {
    imap: ImapConfig,
    smtp: SmtpConfig
  }> = new Map();

  constructor() {
    // Load email accounts on startup
    this.loadEmailAccounts();
  }

  private async loadEmailAccounts() {
    try {
      const accounts = await storage.getEmailAccounts();
      for (const account of accounts) {
        this.registerEmailAccount(account);
      }
      console.log(`Loaded ${accounts.length} email accounts`);
    } catch (error) {
      console.error('Failed to load email accounts:', error);
    }
  }

  public registerEmailAccount(account: EmailAccount) {
    // Create IMAP and SMTP config from the account details
    const imapConfig: ImapConfig = {
      user: account.email,
      password: account.password,
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapSecure === null ? true : account.imapSecure
    };

    const smtpConfig: SmtpConfig = {
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure === null ? true : account.smtpSecure,
      auth: {
        user: account.email,
        pass: account.password
      }
    };

    this.emailAccounts.set(account.id, {
      imap: imapConfig,
      smtp: smtpConfig
    });
  }

  public unregisterEmailAccount(accountId: number) {
    this.emailAccounts.delete(accountId);
  }

  // Fetch emails from an account
  public async fetchEmails(accountId: number, folder: string = 'INBOX', limit: number = 20): Promise<Email[]> {
    const accountConfig = this.emailAccounts.get(accountId);
    if (!accountConfig) {
      throw new Error(`Email account with ID ${accountId} not found`);
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap.default(accountConfig.imap);
      const emails: Email[] = [];

      imap.once('ready', () => {
        imap.openBox(folder, true, (err: Error | null, box: any) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Calculate the range of messages to fetch (most recent)
          const totalMessages = box.messages.total;
          const from = Math.max(1, totalMessages - limit + 1);
          const to = totalMessages;

          if (totalMessages === 0) {
            imap.end();
            return resolve([]);
          }

          const fetchOptions = {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
          };

          const fetch = imap.fetch(`${from}:${to}`, fetchOptions);
          
          fetch.on('message', (msg: any, seqno: number) => {
            const emailData: Partial<Email> & { id?: number } = {
              accountId: accountId,
              read: false,
              to: [],
              cc: null,
              bcc: null,
              contactId: null,
              companyId: null,
              dealId: null,
              messageId: null
            };
            let messageId: string | null = null;

            msg.on('body', async (stream: Readable, info: any) => {
              const content = await streamToString(stream);

              if (info.which === 'TEXT') {
                emailData.body = content;
              } else {
                // Parse headers
                const headers = content.split('\r\n')
                  .filter(line => line.trim() !== '')
                  .reduce((acc, line) => {
                    const [key, ...valueParts] = line.split(':');
                    const value = valueParts.join(':').trim();
                    acc[key.toLowerCase()] = value;
                    return acc;
                  }, {} as Record<string, string>);

                emailData.from = headers.from || '';
                emailData.to = headers.to ? headers.to.split(',').map(e => e.trim()) : [];
                emailData.subject = headers.subject || '(No Subject)';
                emailData.date = headers.date ? new Date(headers.date) : new Date();
                messageId = headers['message-id'] || null;
              }
            });

            msg.once('attributes', (attrs: any) => {
              emailData.messageId = messageId || `${attrs.uid}`;
            });

            msg.once('end', async () => {
              try {
                if (emailData.from && emailData.subject && emailData.body) {
                  // Store the email in the database if it doesn't already exist
                  const existingEmails = await storage.getEmails();
                  const exists = existingEmails.some(email => 
                    email.messageId === emailData.messageId && email.accountId === accountId
                  );
                  
                  if (!exists) {
                    const newEmail = await storage.createEmail(emailData as InsertEmail);
                    emails.push(newEmail);
                    
                    // Create an activity for the new email
                    await storage.createActivity({
                      type: 'email_received',
                      date: emailData.date || new Date(),
                      description: `Email received: ${emailData.subject}`,
                      emailId: newEmail.id,
                      companyId: null,
                      contactId: null,
                      dealId: null,
                      userId: null,
                      taskId: null,
                      metadata: {}
                    });
                  }
                }
              } catch (error) {
                console.error('Error processing email:', error);
              }
            });
          });

          fetch.once('error', (err: Error) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  // Send an email
  public async sendEmail(emailData: {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    accountId: number;
    contactId?: number | null;
    companyId?: number | null;
    dealId?: number | null;
  }): Promise<Email> {
    const { accountId, ...mailData } = emailData;
    
    const accountConfig = this.emailAccounts.get(accountId);
    if (!accountConfig) {
      throw new Error(`Email account with ID ${accountId} not found`);
    }

    const transporter = createTransport(accountConfig.smtp);

    try {
      // Send the email
      await transporter.sendMail({
        from: mailData.from,
        to: mailData.to.join(', '),
        cc: mailData.cc?.join(', '),
        bcc: mailData.bcc?.join(', '),
        subject: mailData.subject,
        html: mailData.body
      });

      // Store the email in the database
      const newEmail: InsertEmail = {
        from: mailData.from,
        to: mailData.to,
        cc: mailData.cc || null,
        bcc: mailData.bcc || null,
        subject: mailData.subject,
        body: mailData.body,
        date: new Date(),
        accountId: accountId,
        companyId: mailData.companyId || null,
        contactId: mailData.contactId || null,
        dealId: mailData.dealId || null,
        read: true,
        messageId: `sent-${Date.now()}`
      };

      const createdEmail = await storage.createEmail(newEmail);
      
      // Create an activity for the sent email
      await storage.createActivity({
        type: 'email_sent',
        date: new Date(),
        description: `Email sent: ${mailData.subject}`,
        emailId: createdEmail.id,
        companyId: mailData.companyId || null,
        contactId: mailData.contactId || null,
        dealId: mailData.dealId || null,
        userId: null,
        taskId: null,
        metadata: {}
      });

      return createdEmail;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Synchronize emails from all accounts
  public async syncAllAccounts(): Promise<number> {
    let totalNewEmails = 0;
    
    // Convert Map entries to array to avoid iteration issues
    const accountIds = Array.from(this.emailAccounts.keys());
    console.log(`Attempting to sync ${accountIds.length} email accounts`);
    
    if (accountIds.length === 0) {
      console.log("No email accounts registered to sync");
      return 0;
    }
    
    for (const accountId of accountIds) {
      try {
        console.log(`Starting sync for account ID: ${accountId}`);
        const newEmails = await this.fetchEmails(accountId);
        console.log(`Fetched ${newEmails.length} new emails for account ID: ${accountId}`);
        totalNewEmails += newEmails.length;
      } catch (error) {
        console.error(`Failed to sync account ${accountId}:`, error);
      }
    }
    
    console.log(`Successfully synced a total of ${totalNewEmails} new emails`);
    return totalNewEmails;
  }
}

// Create a singleton instance
export const emailService = new EmailService();