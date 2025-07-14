export interface Case {
  id: string;
  title: string;
  description: string;
  category: 'cybercrime' | 'financial' | 'gambling' | 'fraud' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'closed' | 'suspended';
  createdDate: string;
  lastUpdated: string;
  assignedOfficer: string;
  evidenceCount: number;
}