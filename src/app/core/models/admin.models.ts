export type AdminRole = "user" | "admin";
export type SessionStatus = "active" | "completed";
export type InterviewStatus = "in-progress" | "completed";
export type SubscriptionPlan = "free" | "pro" | "premium";

export interface AdminLoginResponse {
  admin: {
    email: string;
    role: "admin";
  };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  clerkId: string;
  role: AdminRole;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse extends PaginationMeta {
  users: AdminUser[];
}

export interface AdminSession {
  _id: string;
  problem: string;
  difficulty: "easy" | "medium" | "hard";
  host: AdminUser | null;
  participant: AdminUser | null;
  status: SessionStatus;
  callId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionsResponse extends PaginationMeta {
  sessions: AdminSession[];
}

export interface InterviewQuestionBreakdown {
  questionId?: string | null;
  questionText: string;
  topic?: string;
  difficulty?: string;
  userAnswer?: string;
  aiFeedback?: string;
  score: number;
  timeSpent?: number;
  followUpAsked?: boolean;
  followUpAnswer?: string;
}

export interface AdminInterview {
  _id: string;
  userId: AdminUser | null;
  cvAnalysis?: Record<string, unknown>;
  language: "en" | "ar";
  questions: InterviewQuestionBreakdown[];
  status: InterviewStatus;
  overallScore: number;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface InterviewsResponse extends PaginationMeta {
  interviews: AdminInterview[];
}

export interface SubscriptionDistributionItem {
  plan: SubscriptionPlan;
  count: number;
  percentage: number;
}

export interface DashboardStatsResponse {
  totalUsers: number;
  totalSessions: number;
  totalInterviews: number;
  averageAiScore: number;
  activeSubscriptions: number;
  pendingInvitations: number;
  subscriptionDistribution: SubscriptionDistributionItem[];
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface TimeSeriesResponse {
  labels: string[];
  series: TimeSeriesPoint[];
}

export interface LeaderboardCandidate {
  _id: string;
  userId: AdminUser | null;
  primaryField: string;
  yearsOfExperience?: number;
  keySkills?: string[];
  strongestAreas?: string[];
  notableTechnologies?: string[];
  cvSummary?: string;
  preferredDifficulty?: string;
  totalInterviewsCompleted: number;
  overallAverageScore: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TopCandidatesResponse {
  candidates: LeaderboardCandidate[];
}

export interface ProblemStat {
  category: string;
  attempts: number;
  averageScore: number;
}

export interface ProblemsStatsResponse {
  categories: ProblemStat[];
}

export interface UserRoleUpdateResponse {
  user: AdminUser;
}

export interface SessionListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ApiMessageResponse {
  msg: string;
}

