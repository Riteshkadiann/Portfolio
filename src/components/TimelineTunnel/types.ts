export interface TimelineEvent {
  id: string;
  date: string;
  year: number;
  title: string;
  company: string;
  type: 'work' | 'project' | 'education';
  description: string;
  details: string;
  technologies: string[];
  achievements: string[];
  image?: string;
  github?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
}

export interface NodeData {
  event: TimelineEvent;
  position: [number, number, number];
  rotation: [number, number, number];
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
