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
  address: string | null;
  fullAddress: string | null;
  website: string | null;
  industry: string | null;
  numberOfEmployees: number | null;
  annualRevenue: string | null;
  type: string | null;
  foundedYear: number | null;
  description: string | null;
  logo: string | null;
  owner: number | null;
  source: string | null;
  stage: string | null;
  rating: number | null;
  tags: string[] | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  locationId?: string | null;
  customFields?: Record<string, any> | null;
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
  status: string;
  stage?: PipelineStage;
  stageId?: number | null;
  value: string | null;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  probability: number | null;
  tags: string[] | null;
  notes: string | null;
  description: string | null;
  contacts?: Contact[];
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  synergies?: Synergy[];
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