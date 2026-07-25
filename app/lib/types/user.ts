export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export interface User {
  id: string;
  name: string;
  role: string;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

export interface SigninDto {
  name: string;
  password: string;
}

export interface CreateUserDto {
  name: string;
  password: string;
  lastName?: string;
  role: UserRole;
}
