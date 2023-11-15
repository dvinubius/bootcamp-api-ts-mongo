export const CAREERS = [
  'Web Development',
  'Mobile Development',
  'UI/UX',
  'Data Science',
  'Business',
  'Other',
] as const;
export type Career = (typeof CAREERS)[number];
