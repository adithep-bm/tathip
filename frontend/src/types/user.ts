export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: Permission[];
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface UserFormData {
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  permissions?: string[];
}