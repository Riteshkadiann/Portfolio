// Skill Types
export interface Skill {
  id: string;
  name: string;
  proficiency: number;
  category: string;
  relatedSkills: string[];
  color: string;
  description: string;
}

export interface SkillPosition {
  x: number;
  y: number;
  z: number;
}

// Timeline Types
export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  company: string;
  description: string;
  tags: string[];
  image: string;
  type: 'work' | 'project' | 'education';
}

export interface CardPosition {
  angle: number;
  depth: number;
  radius: number;
}

// Common Types
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}
