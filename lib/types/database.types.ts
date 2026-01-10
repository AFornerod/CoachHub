export type CoachingType =
  | 'athernus'
  | 'personal'
  | 'organizacional_ejecutivo'
  | 'organizacional_equipos'
  | 'deportivo_individual'
  | 'deportivo_equipo'

export type CoachingMethod =
  | 'ontologico'
  | 'sistemico'
  | 'pnl'
  | 'cognitivo'
  | 'emocional'

export type UserRole = 'coach' | 'admin'

export type SubscriptionPlan = 'starter' | 'professional' | 'master'

export type SubscriptionStatus = 'active' | 'inactive' | 'trial'

export type ClientStatus = 'active' | 'inactive' | 'completed'

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export type SessionType = 'online' | 'presencial'

export type GoalStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'cancelled'

export type ActionPlanStatus = 'pending' | 'completed'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  coaching_type?: CoachingType[]
  coaching_method?: CoachingMethod[]
  profile_image?: string
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  created_at: string
}

export interface Client {
  id: string
  coach_id: string
  name: string
  email: string
  phone?: string
  profile_image?: string
  status: ClientStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  coach_id: string
  client_id: string
  title: string
  description?: string
  scheduled_date: string
  duration: number
  status: SessionStatus
  session_type: SessionType
  notes?: string
  ai_summary?: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  client_id: string
  title: string
  description: string
  target_date?: string
  status: GoalStatus
  progress: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  coach_id: string
  client_id: string
  session_id?: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_method: string
  paid_at?: string
  created_at: string
}

export interface ActionPlan {
  id: string
  client_id: string
  session_id?: string
  title: string
  description: string
  due_date?: string
  status: ActionPlanStatus
  created_at: string
}

export interface CompetencyFramework {
  id: string
  name: string
  description: string
  coach_id: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Competency {
  id: string
  framework_id: string
  name: string
  description: string
  order_index: number
  created_at: string
}

export interface CompetencyEvaluation {
  id: string
  client_id: string
  framework_id: string
  coach_id: string
  evaluation_date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface CompetencyScore {
  id: string
  evaluation_id: string
  competency_id: string
  score: number
  notes: string
  created_at: string
}

export const PLAN_LIMITS = {
  starter: { maxClients: 10, hasAI: true, hasMetrics: true },
  professional: { maxClients: 30, hasAI: true, hasMetrics: true },
  master: { maxClients: 999, hasAI: true, hasMetrics: true }
} as const

export const COACHING_TYPES: { value: CoachingType; label: string }[] = [
  { value: 'athernus', label: 'Athernus' },
  { value: 'personal', label: 'Coaching Personal' },
  { value: 'organizacional_ejecutivo', label: 'Coaching Organizacional Ejecutivo' },
  { value: 'organizacional_equipos', label: 'Coaching Organizacional de Equipos' },
  { value: 'deportivo_individual', label: 'Coaching Deportivo Individual' },
  { value: 'deportivo_equipo', label: 'Coaching Deportivo de Equipo' }
]

export const COACHING_METHODS: { value: CoachingMethod; label: string }[] = [
  { value: 'ontologico', label: 'Coaching Ontológico' },
  { value: 'sistemico', label: 'Coaching Sistémico' },
  { value: 'pnl', label: 'PNL (Programación Neurolingüística)' },
  { value: 'cognitivo', label: 'Coaching Cognitivo' },
  { value: 'emocional', label: 'Coaching Emocional' }
]
