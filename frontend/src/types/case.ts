export interface Case {
  case_id: string;
  title: string;
  description: string;
  case_type: 'cybercrime' | 'financial' | 'gambling' | 'fraud' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'closed' | 'suspended';
  createdDate: string;
  lastUpdated: string;
  assignedOfficer: string;
  evidenceCount: number;
}

export interface newCase {
  title: string;
  description: string;
  case_type: 'cybercrime' | 'financial' | 'gambling' | 'fraud' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
}
