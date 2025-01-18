export interface UserProperty {
  userId: string;
  propertyId: string;
  role: 'owner' | 'manager' | 'viewer';
  createdAt: string;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}
