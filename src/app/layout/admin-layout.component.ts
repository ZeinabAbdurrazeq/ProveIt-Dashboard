import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { filter } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ClerkAuthService } from "../core/services/clerk.service";
import { environment } from "../../environments/environment";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

type AdminDensity = "comfortable" | "compact";
type AdminTheme = "corporate" | "night";

const MAIN_THEME_STORAGE_KEY = "provelt-theme";
const ADMIN_DENSITY_STORAGE_KEY = "provelt-admin-density";
const DEFAULT_THEME: AdminTheme = "corporate";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell min-h-screen bg-base-300 text-base-content">
      <div class="flex min-h-screen">
        <div
          class="fixed inset-0 z-40 bg-base-300/70 backdrop-blur-sm transition-opacity lg:hidden"
          [class.pointer-events-none]="!mobileMenuOpen"
          [class.opacity-0]="!mobileMenuOpen"
          [class.opacity-100]="mobileMenuOpen"
          (click)="closeMobileMenu()"
        ></div>

        <aside
          class="admin-sidebar fixed inset-y-0 right-0 z-50 flex w-[260px] flex-col border-l border-base-300 bg-base-100/95 transition-all duration-300 lg:static lg:z-auto lg:translate-x-0"
          [class.translate-x-full]="!mobileMenuOpen"
          [class.translate-x-0]="mobileMenuOpen"
        >
          <div class="admin-sidebar-header flex items-center justify-between gap-3 px-5">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="admin-brand-mark grid h-11 w-11 place-items-center overflow-hidden rounded-2xl">
                <img src="/logo4.jpg" alt="ProveIt" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0">
                <p class="text-xl font-extrabold tracking-tight">ProveIt</p>
                <p class="text-xs uppercase tracking-[0.25em] text-base-content/60">{{ text.portal }}</p>
              </div>
            </div>
          </div>

          <nav class="admin-sidebar-nav flex-1 space-y-1 overflow-y-auto px-3 py-5">
            <a
              *ngFor="let item of navItems"
              [routerLink]="item.path"
              routerLinkActive="admin-nav-active"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
              class="admin-nav-link group flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold transition"
              (click)="closeMobileMenu()"
            >
              <span class="admin-nav-icon grid h-9 w-9 place-items-center rounded-xl text-lg transition">{{ item.icon }}</span>
              <span class="whitespace-nowrap">{{ item.label }}</span>
            </a>
          </nav>

          <div class="space-y-3 border-t border-base-300 px-3 py-4">
            <button class="admin-button-secondary w-full justify-start" type="button" (click)="logout()">
              <span>⎋</span>
              <span>{{ text.logout }}</span>
            </button>
          </div>
        </aside>

        <div class="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
          <header class="admin-navbar sticky top-0 z-30 border-b border-base-300 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div class="flex items-center gap-3">
                <button class="admin-icon-button lg:hidden" type="button" (click)="mobileMenuOpen = true" [attr.aria-label]="text.openMenu">☰</button>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-base-content/60">{{ pageTitle }}</p>
                  <h1 class="text-2xl font-bold tracking-tight text-base-content sm:text-3xl">{{ pageTitle }}</h1>
                </div>
              </div>

              <div class="flex flex-col gap-3 md:flex-row md:items-center">
                <a class="admin-home-link" [href]="mainAppUrl" [attr.aria-label]="text.home" [title]="text.home">
                  <svg viewBox="0 0 24 24" aria-hidden="true" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 10.5 9-7 9 7"></path>
                    <path d="M5 9.5V21h14V9.5"></path>
                    <path d="M9 21v-7h6v7"></path>
                  </svg>
                </a>

                <button class="admin-theme-toggle" type="button" (click)="toggleTheme()" [attr.aria-label]="text.toggleTheme">
                  <span class="admin-theme-toggle-track">
                    <span class="admin-theme-toggle-thumb" [class.is-dark]="currentTheme === 'night'"></span>
                  </span>
                  <span>{{ currentTheme === 'night' ? text.dark : text.light }}</span>
                </button>

                <span class="admin-chip">{{ text.admin }}</span>
                <span class="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-400 sm:inline-flex">{{ adminEmail }}</span>
              </div>
            </div>
          </header>

          <main class="admin-page-body flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly clerkAuth = inject(ClerkAuthService);
  private readonly destroyRef = inject(DestroyRef);

  mobileMenuOpen = false;
  pageTitle = "Overview";
  adminEmail = environment.adminEmail;
  mainAppUrl = environment.mainAppUrl;
  currentTheme: AdminTheme = DEFAULT_THEME;
  currentDensity: AdminDensity = "compact";


  navItems: NavItem[] = [
    { label: "Overview", path: "/dashboard", icon: "▣" },
    { label: "Users", path: "/users", icon: "◫" },
    { label: "Sessions", path: "/sessions", icon: "◎" },
    { label: "AI interviews", path: "/ai-interviews", icon: "✦" },
    { label: "Problems", path: "/problems", icon: "⌘" },
    { label: "Submissions", path: "/submissions", icon: "✓" },
    { label: "Leaderboard", path: "/leaderboard", icon: "★" },
    { label: "Subscriptions", path: "/subscriptions", icon: "◉" },
    { label: "Blog", path: "/blog-posts", icon: "✎" },
  ];

  readonly text = {
    portal: "Admin portal",
    home: "Back to main app",
    logout: "Sign out",
    openMenu: "Open menu",
    toggleTheme: "Toggle dark or light mode",
    light: "Light",
    dark: "Dark",
    admin: "Admin",
  } as const;

  ngOnInit(): void {
    this.currentTheme = this.readPreference<AdminTheme>(MAIN_THEME_STORAGE_KEY, DEFAULT_THEME, ["corporate", "night"]);
    this.currentDensity = "compact";
    localStorage.setItem(ADMIN_DENSITY_STORAGE_KEY, this.currentDensity);
    this.applyPreferences();
    this.updateTitle();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.updateTitle();
        this.mobileMenuOpen = false;
      });
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }


  setDensity(density: AdminDensity): void {
    this.currentDensity = density;
    localStorage.setItem(ADMIN_DENSITY_STORAGE_KEY, density);
    this.applyPreferences();
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === "night" ? "corporate" : "night";
    localStorage.setItem(MAIN_THEME_STORAGE_KEY, this.currentTheme);
    this.applyPreferences();
  }

  logout(): void {
    void this.clerkAuth
      .signOut()
      .finally(() => window.location.replace(environment.mainAppUrl));
  }

  private updateTitle(): void {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    const data = route.snapshot.data;
    this.pageTitle = String(data["titleEn"] || data["title"] || "Dashboard");
  }

  private applyPreferences(): void {
    const root = document.documentElement;
    const body = document.body;
    root.lang = "en";
    root.dir = "ltr";
    body.dataset["theme"] = this.currentTheme;
    root.setAttribute("data-theme", this.currentTheme);
    body.classList.toggle("admin-density-compact", this.currentDensity === "compact");
  }

  private readPreference<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  }

}
