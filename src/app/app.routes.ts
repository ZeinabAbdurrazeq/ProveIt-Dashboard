import { Routes } from "@angular/router";

import { authGuard } from "./core/guards/auth.guard";
import { AdminLayoutComponent } from "./layout/admin-layout.component";
import { DashboardPageComponent } from "./pages/dashboard/dashboard-page.component";
import { UsersPageComponent } from "./pages/users/users-page.component";
import { SessionsPageComponent } from "./pages/sessions/sessions-page.component";
import { AiInterviewsPageComponent } from "./pages/ai-interviews/ai-interviews-page.component";
import { LoginPageComponent } from "./pages/login/login-page.component";

export const routes: Routes = [
  {
    path: "login",
    component: LoginPageComponent,
    data: { title: "Admin Login" },
  },
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
      { path: "dashboard", component: DashboardPageComponent, data: { title: "Dashboard" } },
      { path: "users", component: UsersPageComponent, data: { title: "Users" } },
      { path: "sessions", component: SessionsPageComponent, data: { title: "Sessions" } },
      { path: "ai-interviews", component: AiInterviewsPageComponent, data: { title: "AI Interviews" } },
      { path: "**", redirectTo: "dashboard" },
    ],
  },
  { path: "**", redirectTo: "login" },
];
