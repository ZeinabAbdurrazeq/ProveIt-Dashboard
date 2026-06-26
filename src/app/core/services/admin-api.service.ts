import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import {
  DashboardStatsResponse,
  InterviewsResponse,
  ProblemsStatsResponse,
  SessionsResponse,
  TimeSeriesResponse,
  TopCandidatesResponse,
  UserListQuery,
  UserRoleUpdateResponse,
  UsersResponse,
  AdminLoginResponse,
} from "../models/admin.models";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class AdminApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  verifyAdminAccess(): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.apiBaseUrl}/login`, {});
  }

  getDashboardStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(`${this.apiBaseUrl}/stats/dashboard`);
  }

  getSessionsOverTime(): Observable<TimeSeriesResponse> {
    return this.http.get<TimeSeriesResponse>(`${this.apiBaseUrl}/stats/sessions-over-time`);
  }

  getInterviewsPerDay(): Observable<TimeSeriesResponse> {
    return this.http.get<TimeSeriesResponse>(`${this.apiBaseUrl}/stats/interviews-per-day`);
  }

  getUsers(query: UserListQuery = {}): Observable<UsersResponse> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<UsersResponse>(`${this.apiBaseUrl}/users`, { params });
  }

  updateUserRole(userId: string, role: "user" | "admin"): Observable<UserRoleUpdateResponse> {
    return this.http.patch<UserRoleUpdateResponse>(`${this.apiBaseUrl}/users/${userId}/role`, {
      role,
    });
  }

  getSessions(query: UserListQuery & { status?: string } = {}): Observable<SessionsResponse> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<SessionsResponse>(`${this.apiBaseUrl}/sessions`, { params });
  }

  getAiInterviews(query: UserListQuery & { status?: string } = {}): Observable<InterviewsResponse> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<InterviewsResponse>(`${this.apiBaseUrl}/ai-interviews`, { params });
  }

  getTopCandidates(): Observable<TopCandidatesResponse> {
    return this.http.get<TopCandidatesResponse>(`${this.apiBaseUrl}/top-candidates`);
  }

  getProblemsStats(): Observable<ProblemsStatsResponse> {
    return this.http.get<ProblemsStatsResponse>(`${this.apiBaseUrl}/problems-stats`);
  }
}


