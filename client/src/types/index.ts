// Tipi per le email
export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface Email {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  receivedAt: string;
  isRead: boolean;
  attachments: EmailAttachment[];
  starred?: boolean;
  entityId?: string;
  entityType?: 'contact' | 'company' | 'deal' | 'lead';
}

// Altri tipi utilizzati nell'applicazione
export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: number;
  companyName?: string;
  avatarUrl?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  isPrimary?: boolean;
  synergies?: number[];
}

export interface Company {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  employees?: number;
  revenue?: string;
  createdAt?: string;
  updatedAt?: string;
  contacts?: number[];
  branches?: number[];
  deals?: number[];
  tags?: string[];
  customFields?: Record<string, string>;
}

export interface Deal {
  id: number;
  name: string;
  value?: number;
  stage?: string;
  contactId?: number;
  contactName?: string;
  companyId?: number;
  companyName?: string;
  closingDate?: string;
  probability?: number;
  status?: 'active' | 'won' | 'lost';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  synergies?: number[];
}

export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface Branch {
  id: number;
  name: string;
  companyId: number;
  companyName?: string;
  type?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Synergy {
  id: number;
  name: string;
  description?: string;
  contacts?: number[];
  deals?: number[];
  status?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  entityType: string;
  entityId: number;
  entityName?: string;
  userId: number;
  userName?: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
  lastLogin?: string;
  isActive?: boolean;
}

export interface Area {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  contactId?: number;
  isPrimary?: boolean;
}