export type CasePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Case {
  case_id: string;
  title: string;
  description: string;
  case_type: 'cyber_crimes' | 'financial' | 'gambling' | 'fraud' | 'other';
  priority: CasePriority;
  status: 'open' | 'investigating' | 'closed' | 'suspended';
  createdDate: string;
  lastUpdated: string;
  assignedOfficer: string;
  evidenceCount: number;
}

export interface newCase {
  title: string;
  description: string;
  case_type: 'cyber_crimes' | 'financial' | 'gambling' | 'fraud' | 'other';
  priority: CasePriority;
}
