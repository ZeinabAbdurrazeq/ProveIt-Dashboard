import { Routes } from "@angular/router";

import { authGuard } from "./core/guards/auth.guard";
import { AdminLayoutComponent } from "./layout/admin-layout.component";
import { DashboardPageComponent } from "./pages/dashboard/dashboard-page.component";
import { UsersPageComponent } from "./pages/users/users-page.component";
import { SessionsPageComponent } from "./pages/sessions/sessions-page.component";
import { AiInterviewsPageComponent } from "./pages/ai-interviews/ai-interviews-page.component";
import { LoginPageComponent } from "./pages/login/login-page.component";
import { BlogPostsPageComponent } from "./pages/blog-posts/blog-posts-page.component";
import { ProblemsPageComponent } from "./pages/problems/problems-page.component";
import { SubmissionsPageComponent } from "./pages/submissions/submissions-page.component";
import { SubscriptionsPageComponent } from "./pages/subscriptions/subscriptions-page.component";
import { LeaderboardPageComponent } from "./pages/leaderboard/leaderboard-page.component";
import { CommunityModerationPageComponent } from "./pages/community-moderation/community-moderation-page.component";

export const routes: Routes = [
  {
    path: "login",
    component: LoginPageComponent,
    data: { title: "Admin login", titleEn: "Admin login" },
  },
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      { path: "dashboard", component: DashboardPageComponent, data: { title: "Overview", titleEn: "Overview" } },
      { path: "users", component: UsersPageComponent, data: { title: "Users", titleEn: "Users" } },
      { path: "sessions", component: SessionsPageComponent, data: { title: "Sessions", titleEn: "Sessions" } },
      { path: "ai-interviews", component: AiInterviewsPageComponent, data: { title: "AI interviews", titleEn: "AI interviews" } },
      { path: "problems", component: ProblemsPageComponent, data: { title: "Problems", titleEn: "Problems" } },
      { path: "submissions", component: SubmissionsPageComponent, data: { title: "Submissions", titleEn: "Submissions" } },
      { path: "leaderboard", component: LeaderboardPageComponent, data: { title: "Leaderboard", titleEn: "Leaderboard" } },
      { path: "subscriptions", component: SubscriptionsPageComponent, data: { title: "Subscriptions", titleEn: "Subscriptions" } },
      { path: "blog-posts", component: BlogPostsPageComponent, data: { title: "Blog", titleEn: "Blog" } },
      { path: "community-moderation", component: CommunityModerationPageComponent, data: { title: "Posts Review", titleEn: "Posts Review" } },
      { path: "**", redirectTo: "dashboard" },
    ],
  },
  { path: "**", redirectTo: "login" },
];
