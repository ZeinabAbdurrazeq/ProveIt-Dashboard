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

export const routes: Routes = [
  {
    path: "login",
    component: LoginPageComponent,
    data: { title: "تسجيل دخول الإدارة", titleAr: "تسجيل دخول الإدارة", titleEn: "Admin login" },
  },
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      { path: "dashboard", component: DashboardPageComponent, data: { title: "لوحة التحكم", titleAr: "لوحة التحكم", titleEn: "Overview" } },
      { path: "users", component: UsersPageComponent, data: { title: "المستخدمون", titleAr: "المستخدمون", titleEn: "Users" } },
      { path: "sessions", component: SessionsPageComponent, data: { title: "الجلسات", titleAr: "الجلسات", titleEn: "Sessions" } },
      { path: "ai-interviews", component: AiInterviewsPageComponent, data: { title: "مقابلات الذكاء", titleAr: "مقابلات الذكاء", titleEn: "AI interviews" } },
      { path: "problems", component: ProblemsPageComponent, data: { title: "المسائل", titleAr: "المسائل", titleEn: "Problems" } },
      { path: "submissions", component: SubmissionsPageComponent, data: { title: "التسليمات", titleAr: "التسليمات", titleEn: "Submissions" } },
      { path: "blog-posts", component: BlogPostsPageComponent, data: { title: "المدونة", titleAr: "المدونة", titleEn: "Blog" } },
      { path: "**", redirectTo: "dashboard" },
    ],
  },
  { path: "**", redirectTo: "login" },
];
