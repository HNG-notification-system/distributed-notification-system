export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
