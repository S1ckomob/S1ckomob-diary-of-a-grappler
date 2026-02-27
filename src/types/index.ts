export type Belt = "white" | "blue" | "purple" | "brown" | "black";

export interface Profile {
  id: string;
  name: string | null;
  belt: Belt;
  stripes: number;
  gym_id: string | null;
  coach_id: string | null;
  dna_guard: number;
  dna_passing: number;
  dna_submissions: number;
  dna_takedowns: number;
  dna_escapes: number;
  weight_class: string | null;
  gi: boolean;
  nogi: boolean;
  unit_system: string;
  training_goals: string | null;
  bio: string | null;
  created_at: string;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Technique {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  difficulty: Difficulty;
  is_beginner: boolean;
  video_url: string | null;
  created_at: string;
}

export interface Gym {
  id: string;
  name: string;
  code: string;
  coach_id: string | null;
  plan: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: string;
  description: string | null;
  target: number | null;
  current: number;
  unit: string | null;
  month: number;
  year: number;
  set_by_coach: boolean;
  coach_note: string | null;
  completed: boolean;
  created_at: string;
}

export type SessionType = "rolling" | "drilling" | "competition";

export interface Session {
  id: string;
  user_id: string;
  date: string;
  session_type: SessionType;
  duration_minutes: number | null;
  notes: string | null;
  rounds: number | null;
  taps_given: number;
  taps_received: number;
  created_at: string;
}
