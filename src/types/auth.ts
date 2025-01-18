export interface UserPropertyRecord {
  userId: string;
  propertyId: string;
  role: 'owner' | 'manager' | 'viewer';
  createdAt: Date;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
