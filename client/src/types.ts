import { Json } from "./types/json";

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
  address: string | null; // @deprecated - Mantenuto per retrocompatibilità
  /** Indirizzo completo (via, civico, cap, città, provincia, nazione) */
  fullAddress: string | null; // Mappato a full_address nel DB
  country: string | null; // @deprecated - Mantenuto per retrocompatibilità
  
  // Campi azienda
  website: string | null;
  industry: string | null;
  sector: string | null;
  description: string | null;
  
  // Informazioni dimensionali
  employeeCount: number | null; // Mappato a employee_count nel DB
  annualRevenue: number | null; // Mappato a annual_revenue nel DB
  foundedYear: number | null; // Mappato a founded_year nel DB
  
  // Media e URL
  logo: string | null;
  linkedinUrl: string | null; // Mappato a linkedin_url nel DB
  
  // Relazioni
  parentCompanyId: number | null; // Mappato a parent_company_id nel DB
  
  // Categorizzazione
  tags: string[] | null;
  companyType: string | null; // Mappato a company_type nel DB
  brands: string[] | null;
  channels: string[] | null;
  productsOrServicesTags: string[] | null; // Mappato a products_or_services_tags nel DB
  locationTypes: string[] | null; // Mappato a location_types nel DB
  
  /** Relazioni fra te e l'azienda (tag multipli) */
  relationshipType: string[];
  
  // Stati e configurazioni
  isActiveRep: boolean; // Mappato a is_active_rep nel DB
  
  // Date di follow-up
  lastContactedAt: Date | null; // Mappato a last_contacted_at nel DB
  nextFollowUpAt: Date | null; // Mappato a next_follow_up_at nel DB
  
  // Campi vari
  notes: string | null;
  customFields: Record<string, any> | null; // Mappato a custom_fields nel DB
  
  // Metadati
  createdAt: Date | null; // Mappato a created_at nel DB
  updatedAt: Date | null; // Mappato a updated_at nel DB
  
  // Relazioni (per compatibilità con il resto dell'app)
  areasOfActivity?: AreaOfActivity[];
}

export interface AreaOfActivity {
  id: number;
  contactId: number;
  companyId: number | null;
  companyName: string | null;
  role: string | null;
  jobDescription: string | null;
  isPrimary: boolean | null;
  branchId?: number | null;
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

export interface Sector { id: number; name: string }
export interface SubSector { id: number; sectorId: number; name: string }
export interface JobTitle { id: number; subSectorId: number; name: string }