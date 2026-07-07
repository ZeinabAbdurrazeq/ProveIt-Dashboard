import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import {
  DashboardStatsResponse,
  InterviewsResponse,
  ProblemsStatsResponse,
  SessionsResponse,
  SubmissionsResponse,
  TimeSeriesResponse,
  TopCandidatesResponse,
  UserListQuery,
  UserRoleUpdateResponse,
  UsersResponse,
  AdminUser,
  AdminUserResponse,
  AdminLoginResponse,
  AdminProblem,
  AdminBlogPost,
  BlogPostResponse,
  BlogPostsResponse,
  CommunityPostResponse,
  CommunityPostsResponse,
  CommunityPostStatus,
  ProblemResponse,
  ProblemsResponse,
  ApiMessageResponse,
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

  createUser(user: Partial<AdminUser>): Observable<AdminUserResponse> {
    return this.http.post<AdminUserResponse>(`${this.apiBaseUrl}/users`, user);
  }

  updateUser(userId: string, user: Partial<AdminUser>): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(`${this.apiBaseUrl}/users/${userId}`, user);
  }

  updateUserRole(userId: string, role: "user" | "admin"): Observable<UserRoleUpdateResponse> {
    return this.http.patch<UserRoleUpdateResponse>(`${this.apiBaseUrl}/users/${userId}/role`, {
      role,
    });
  }

  deleteUser(userId: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiBaseUrl}/users/${userId}`);
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

  getSubmissions(
    query: UserListQuery & { status?: string; difficulty?: string } = {},
  ): Observable<SubmissionsResponse> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<SubmissionsResponse>(`${this.apiBaseUrl}/submissions`, { params });
  }

  getTopCandidates(): Observable<TopCandidatesResponse> {
    return this.http.get<TopCandidatesResponse>(`${this.apiBaseUrl}/top-candidates`);
  }

  getProblemsStats(): Observable<ProblemsStatsResponse> {
    return this.http.get<ProblemsStatsResponse>(`${this.apiBaseUrl}/problems-stats`);
  }

  getProblems(query: UserListQuery & { difficulty?: string } = {}): Observable<ProblemsResponse> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ProblemsResponse>(`${this.apiBaseUrl}/problems`, { params });
  }

  createProblem(problem: Partial<AdminProblem>): Observable<ProblemResponse> {
    return this.http.post<ProblemResponse>(`${this.apiBaseUrl}/problems`, problem);
  }

  updateProblem(id: string, problem: Partial<AdminProblem>): Observable<ProblemResponse> {
    return this.http.put<ProblemResponse>(`${this.apiBaseUrl}/problems/${id}`, problem);
  }

  deleteProblem(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiBaseUrl}/problems/${id}`);
  }

  getBlogPosts(search = ""): Observable<BlogPostsResponse> {
    const params = search ? new HttpParams().set("search", search) : undefined;
    return this.http.get<BlogPostsResponse>(`${this.apiBaseUrl}/blog-posts`, { params });
  }

  createBlogPost(post: Partial<AdminBlogPost>): Observable<BlogPostResponse> {
    return this.http.post<BlogPostResponse>(`${this.apiBaseUrl}/blog-posts`, post);
  }

  updateBlogPost(id: string, post: Partial<AdminBlogPost>): Observable<BlogPostResponse> {
    return this.http.put<BlogPostResponse>(`${this.apiBaseUrl}/blog-posts/${id}`, post);
  }

  deleteBlogPost(id: string): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.apiBaseUrl}/blog-posts/${id}`);
  }

  getCommunityPosts(status: CommunityPostStatus = "pending"): Observable<CommunityPostsResponse> {
    const params = new HttpParams().set("status", status);
    return this.http.get<CommunityPostsResponse>(`${this.apiBaseUrl}/community-posts`, {
      params,
    });
  }

  approveCommunityPost(id: string): Observable<CommunityPostResponse> {
    return this.http.patch<CommunityPostResponse>(
      `${this.apiBaseUrl}/community-posts/${id}/approve`,
      {},
    );
  }

  rejectCommunityPost(id: string, reason = ""): Observable<CommunityPostResponse> {
    return this.http.patch<CommunityPostResponse>(
      `${this.apiBaseUrl}/community-posts/${id}/reject`,
      { reason },
    );
  }
}
