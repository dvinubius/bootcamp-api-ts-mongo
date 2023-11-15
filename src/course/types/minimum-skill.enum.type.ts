export const MINIMUM_SKILLS = ['beginner', 'intermediate', 'advanced'] as const;
export type MinimumSkill = (typeof MINIMUM_SKILLS)[number];
