import { Json } from "@/types/json";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  companyEmail: string | null;
  privateEmail: string | null;
  jobTitle: string | null;
  birthday: Date | null;
  address: string | null;
  fullAddress: string | null;
  notes: string | null;
  avatar: string | null;
  source: string | null;
  tags: string[] | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  company?: Company;
  companyId?: number;
  areasOfActivity?: AreaOfActivity[];
  customFields?: Record<string, any> | null;
}

export interface Company {
  id: number;
  name: string;
  status: string;
  email: string | null;
  phone: string | null;
  
  // Campi indirizzo (unificati)
  address: string | null; // Mantenuto per retrocompatibilità
  full_address: string | null; // Campo DB
  fullAddress: string | null; // Alias frontend di full_address
  country: string | null;
  
  // Campi azienda
  website: string | null;
  industry: string | null;
  sector: string | null;
  description: string | null;
  
  // Informazioni dimensionali
  employee_count: number | null; // Campo DB
  employeeCount: number | null; // Alias frontend
  annual_revenue: number | null; // Campo DB
  annualRevenue: number | null; // Alias frontend
  founded_year: number | null; // Campo DB
  foundedYear: number | null; // Alias frontend
  
  // Media e URL
  logo: string | null;
  linkedin_url: string | null; // Campo DB
  linkedinUrl: string | null; // Alias frontend
  
  // Relazioni
  parent_company_id: number | null; // Campo DB
  parentCompanyId: number | null; // Alias frontend
  
  // Categorizzazione
  tags: string[] | null;
  company_type: string | null; // Campo DB
  companyType: string | null; // Alias frontend
  brands: string[] | null;
  channels: string[] | null;
  products_or_services_tags: string[] | null; // Campo DB
  productsOrServicesTags: string[] | null; // Alias frontend
  location_types: string[] | null; // Campo DB
  locationTypes: string[] | null; // Alias frontend
  
  // Stati e configurazioni
  is_active_rep: boolean; // Campo DB
  isActiveRep: boolean; // Alias frontend
  
  // Date di follow-up
  last_contacted_at: Date | null; // Campo DB
  lastContactedAt: Date | null; // Alias frontend
  next_follow_up_at: Date | null; // Campo DB
  nextFollowUpAt: Date | null; // Alias frontend
  
  // Campi vari
  notes: string | null;
  custom_fields: Record<string, any> | null; // Campo DB
  customFields: Record<string, any> | null; // Alias frontend
  
  // Metadati
  created_at: Date | null; // Campo DB
  createdAt: Date | null; // Alias frontend
  updated_at: Date | null; // Campo DB
  updatedAt: Date | null; // Alias frontend
}

export interface AreaOfActivity {
  id: number;
  contactId: number;
  companyId: number | null;
  companyName: string | null;
  role: string | null;
  jobDescription: string | null;
  isPrimary: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Deal {
  id: number;
  name: string;
  companyId: number | null;
  company?: Company;
  contactId?: number | null;
  contact?: Contact;
  branchId?: number | null;
  branch?: Branch;
  status: string;
  stage?: PipelineStage;
  stageId?: number | null;
  value: string | null;
  expectedCloseDate: string | null;
  startDate?: string | null;
  expectedRevenue?: number | null;
  tags: string[] | null;
  notes: string | null;
  files?: any[] | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  synergies?: Synergy[];
}

// Struttura per i form di creazione/modifica deal
export interface DealInfo {
  id?: number;
  name: string;
  companyId?: number | null;
  contactId?: number | null;
  branchId?: number | null;
  stageId?: number;
  value: number;
  expectedCloseDate?: string | Date;
  startDate?: string | Date;
  expectedRevenue?: number;
  tags?: string[] | null;
  notes?: string | null;
  status?: string;
  files?: any[] | null;
}

export interface PipelineStage {
  id: number;
  name: string;
  order: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  description?: string | null;
  color?: string | null;
}

export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  leadOwner?: User | null;
  leadOwnerId?: number | null;
}

export interface Synergy {
  id: number;
  type: string;
  entityType: string;
  entityId: number;
  targetType: string;
  targetId: number;
  strength: number | null;
  description: string | null;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  entity?: Contact | Company | Deal;
  target?: Contact | Company | Deal;
}

export interface EmailAccount {
  id: number;
  name: string | null;
  email: string;
  username: string;
  status: "active" | "archived";
  userId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Email {
  id: number;
  date: Date;
  accountId: number;
  messageId: string | null;
  from: string;
  to: string[] | null;
  cc: string[] | null;
  bcc: string[] | null;
  subject: string | null;
  body: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  isFlagged: boolean;
  folder: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Interfaccia per definire la struttura di un manager
export interface BranchManager {
  id: string;
  name: string;
  role: string;
  contactId?: string; // ID del contatto collegato
  contact?: Contact; // Riferimento opzionale al contatto collegato
}

export interface Branch {
  id: number;
  companyId: number;
  companyName?: string;
  name: string;
  type: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  isHeadquarters: boolean | null;
  managers: BranchManager[] | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  customFields: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  priority: string | null;
  assignedToId: number | null;
  assignedTo?: User;
  relatedToType: string | null;
  relatedToId: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  completed: boolean;
  completedAt: Date | null;
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  location: string | null;
  attendees: number[] | null;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}