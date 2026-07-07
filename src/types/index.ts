export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP' | 'VIEWER';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
export type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'COLD_CALL'
  | 'EMAIL'
  | 'SOCIAL_MEDIA'
  | 'EVENT'
  | 'OTHER';

export type DealStage =
  | 'PROSPECTING'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';
export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: LeadSource;
  notes: string | null;
  companyId: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  companyId: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  priority: DealPriority;
  expectedCloseDate: string | null;
  notes: string | null;
  customerId: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; firstName: string; lastName: string } | null;
  assignedTo: { id: string; name: string } | null;
}

export interface DashboardStats {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalCustomers: number;
  totalDeals: number;
  openDealValue: number;
  recentLeads: Lead[];
}

export type PipelineBoard = Record<DealStage, Deal[]>;

export const DEAL_STAGES: DealStage[] = [
  'PROSPECTING',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export const STAGE_LABELS: Record<DealStage, string> = {
  PROSPECTING: 'Prospecting',
  QUALIFICATION: 'Qualification',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};
