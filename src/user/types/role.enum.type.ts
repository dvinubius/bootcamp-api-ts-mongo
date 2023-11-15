export const ROLES = ['publisher', 'user', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = 'user';
