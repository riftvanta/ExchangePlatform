export type Users = {
  id: string;
  email: string;
  password: string;
  salt: string;
  createdAt: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
};

export type NewUsers = {
  id?: string;
  email: string;
  password: string;
  salt: string;
  createdAt?: Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isAdmin?: boolean;
};