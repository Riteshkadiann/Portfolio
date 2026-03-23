export interface Skill {
  id: string;
  name: string;
  proficiency: number;
  category: string;
  color: string;
  description: string;
  relatedSkills: string[];
}

export interface Category {
  name: string;
  color: string;
}

export interface SkillsData {
  skills: Skill[];
  categories: Record<string, Category>;
}

export interface PlanetData {
  skill: Skill;
  position: [number, number, number];
  size: number;
  glowIntensity: number;
}

export interface ConnectionData {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}
