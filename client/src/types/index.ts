export interface DashboardSummary {
  openDeals: number;
  totalDealValue: number;
  activeContacts: number;
  totalCompanies: number;
  upcomingTasksCount: number;
  overdueTasksCount: number;
}

export interface PipelineStage {
  id: number;
  name: string;
  order: number;
}

export interface DealInfo {
  id: number;
  name: string;
  value: number;
  stageId: number;
  contactId: number | null;
  companyId: number | null;
  expectedCloseDate: string | null;
  notes: string | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageSummary {
  stage: PipelineStage;
  deals: DealInfo[];
  count: number;
  value: number;
}

export interface Contact {
  id: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  
  // Contact information
  mobilePhone?: string | null;
  companyEmail?: string | null;
  privateEmail?: string | null;
  officePhone?: string | null;
  privatePhone?: string | null;
  
  // Social profiles
  linkedin?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  
  // For backward compatibility with existing code
  email?: string;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: number | null;
  
  tags: string[] | null;
  notes: string | null;
  customFields: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  notes: string | null;
  customFields: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  date: string;
  userId: number | null;
  contactId: number | null;
  companyId: number | null;
  dealId: number | null;
  emailId: number | null;
  taskId: number | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  assignedToId: number | null;
  contactId: number | null;
  companyId: number | null;
  dealId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  meetingType: 'Call' | 'In-Person' | 'Virtual';
  attendees: {
    internal: number[];
    external: number[];
  } | null;
  contactId: number | null;
  companyId: number | null;
  dealId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAccount {
  id: number;
  email: string;
  displayName: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  userId: number;
}

export interface Email {
  id: number;
  subject: string;
  body: string;
  from: string;
  to: string[];
  cc: string[] | null;
  bcc: string[] | null;
  date: string;
  read: boolean;
  accountId: number;
  contactId: number | null;
  companyId: number | null;
  dealId: number | null;
  messageId: string | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  dealsByStage: StageSummary[];
  recentActivities: Activity[];
  upcomingMeetings: Meeting[];
  upcomingTasks: Task[];
  recentContacts: Contact[];
}
