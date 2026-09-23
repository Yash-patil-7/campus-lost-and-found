export type UserRole = 'STUDENT' | 'ADMIN';

export type LostItemStatus =
  | 'SUBMITTED'
  | 'ACTIVE_SEARCH'
  | 'POSSIBLE_MATCH'
  | 'VERIFICATION'
  | 'RETURNED'
  | 'CLOSED';

export type FoundItemStatus =
  | 'SUBMITTED'
  | 'HANDOVER_PENDING'
  | 'RECEIVED_BY_ADMIN'
  | 'POSSIBLE_MATCH'
  | 'OWNER_IDENTIFIED'
  | 'VERIFICATION'
  | 'RETURNED'
  | 'CLOSED';

export type MatchStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type VerificationStatus = 'PENDING' | 'SUBMITTED' | 'PASSED' | 'FAILED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  roll_number?: string;
  department?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface LostItem {
  id: number;
  case_id: string;
  reporter_id: number;
  title: string;
  category: string;
  brand?: string;
  color?: string;
  location: string;
  date_lost: string;
  time_lost?: string;
  description: string;
  image_url?: string;
  status: LostItemStatus;
  created_at: string;
  updated_at: string;
  reporter_name?: string;
  reporter_email?: string;
}

export interface FoundItem {
  id: number;
  case_id: string;
  finder_id: number;
  title: string;
  category: string;
  brand?: string;
  color?: string;
  location: string;
  date_found: string;
  time_found?: string;
  description: string;
  image_url?: string;
  status: FoundItemStatus;
  physical_location?: string;
  condition_notes?: string;
  received_at?: string;
  received_by_id?: number;
  created_at: string;
  updated_at: string;
  finder_name?: string;
}

export interface MatchSignal {
  category: number;
  location: number;
  brand: number;
  color: number;
  description: number;
  date: number;
}

export interface Match {
  id: number;
  lost_item_id: number;
  found_item_id: number;
  score: number;
  signals_json: MatchSignal;
  status: MatchStatus;
  created_at: string;
  lost_item?: LostItem;
  found_item?: FoundItem;
}

export interface Verification {
  id: number;
  match_id: number;
  question: string;
  answer?: string;
  answer_submitted_at?: string;
  status: VerificationStatus;
  notes?: string;
  created_at: string;
  match?: Match;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  case_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id: number;
  actor_name?: string;
  action: string;
  case_id?: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  timestamp: string;
}

export interface AnalyticsData {
  total_lost: number;
  total_found: number;
  pending_handovers: number;
  items_received: number;
  possible_matches: number;
  total_returned: number;
  total_unclaimed: number;
  recovery_rate_percent: number;
  avg_time_to_handover_hours: number;
  avg_recovery_time_days: number;
  category_distribution: Record<string, number>;
  location_distribution: Record<string, number>;
}
