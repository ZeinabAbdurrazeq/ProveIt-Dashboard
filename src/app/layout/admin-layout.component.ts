import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { filter } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ClerkAuthService } from "../core/services/clerk.service";
import { environment } from "../../environments/environment";

interface NavItem {
  labelAr: string;
  labelEn: string;
  path: string;
  icon: string;
}

type AdminLanguage = "ar" | "en";
type AdminTheme = "night" | "corporate";
type AdminDensity = "comfortable" | "compact";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
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
              <div class="admin-brand-mark grid h-11 w-11 place-items-center rounded-2xl text-xl font-black">
                P
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
              <span class="whitespace-nowrap">{{ currentLanguage === 'ar' ? item.labelAr : item.labelEn }}</span>
            </a>
          </nav>

          <div class="space-y-3 border-t border-base-300 px-3 py-4">
            <div class="admin-session-card rounded-2xl border border-base-300 p-4">
              <p class="text-sm font-semibold text-base-content">{{ text.adminAccess }}</p>
              <p class="mt-1 text-xs leading-5 text-base-content/60">{{ text.sharedSession }}</p>
            </div>
            <a class="admin-button-secondary w-full justify-start" [href]="mainAppUrl">
              <span>↗</span>
              <span>{{ text.backToSite }}</span>
            </a>
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
                <label class="admin-search-field">
                  <span>⌕</span>
                  <input type="search" [placeholder]="text.search" />
                </label>

                <div class="admin-segmented" role="group" [attr.aria-label]="text.theme">
                  <button type="button" [class.active]="currentTheme === 'corporate'" (click)="setTheme('corporate')">{{ text.light }}</button>
                  <button type="button" [class.active]="currentTheme === 'night'" (click)="setTheme('night')">{{ text.dark }}</button>
                </div>

                <div class="admin-segmented" role="group" [attr.aria-label]="text.language">
                  <button type="button" [class.active]="currentLanguage === 'ar'" (click)="setLanguage('ar')">عربي</button>
                  <button type="button" [class.active]="currentLanguage === 'en'" (click)="setLanguage('en')">EN</button>
                </div>

                <div class="admin-segmented" role="group" [attr.aria-label]="text.dataView">
                  <button type="button" [class.active]="currentDensity === 'comfortable'" (click)="setDensity('comfortable')">{{ text.comfortable }}</button>
                  <button type="button" [class.active]="currentDensity === 'compact'" (click)="setDensity('compact')">{{ text.compact }}</button>
                </div>

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
  pageTitle = "لوحة التحكم";
  adminEmail = environment.adminEmail;
  mainAppUrl = environment.mainAppUrl;
  currentLanguage: AdminLanguage = "ar";
  currentTheme: AdminTheme = "night";
  currentDensity: AdminDensity = "comfortable";

  navItems: NavItem[] = [
    { labelAr: "الرئيسية", labelEn: "Overview", path: "/dashboard", icon: "▣" },
    { labelAr: "المستخدمون", labelEn: "Users", path: "/users", icon: "◫" },
    { labelAr: "الجلسات", labelEn: "Sessions", path: "/sessions", icon: "◎" },
    { labelAr: "مقابلات الذكاء", labelEn: "AI interviews", path: "/ai-interviews", icon: "✦" },
    { labelAr: "المسائل", labelEn: "Problems", path: "/problems", icon: "⌘" },
    { labelAr: "التسليمات", labelEn: "Submissions", path: "/submissions", icon: "✓" },
    { labelAr: "المدونة", labelEn: "Blog", path: "/blog-posts", icon: "✎" },
  ];

  readonly translations = {
    ar: {
      portal: "لوحة الإدارة",
      adminAccess: "صلاحيات الإدارة",
      sharedSession: "الجلسة مشتركة مع Clerk في الموقع الرئيسي.",
      backToSite: "العودة للموقع",
      logout: "تسجيل الخروج",
      openMenu: "فتح القائمة",
      search: "بحث سريع...",
      theme: "السمة",
      light: "فاتح",
      dark: "داكن",
      language: "اللغة",
      dataView: "عرض البيانات",
      comfortable: "واسع",
      compact: "مكثف",
      admin: "مدير",
    },
    en: {
      portal: "Admin portal",
      adminAccess: "Admin access",
      sharedSession: "Session is shared with Clerk on the main website.",
      backToSite: "Back to website",
      logout: "Sign out",
      openMenu: "Open menu",
      search: "Quick search...",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      language: "Language",
      dataView: "Data view",
      comfortable: "Comfort",
      compact: "Compact",
      admin: "Admin",
    },
  } as const;

  get text() {
    return this.translations[this.currentLanguage];
  }

  ngOnInit(): void {
    this.currentLanguage = this.readPreference<AdminLanguage>("adminLanguage", "ar", ["ar", "en"]);
    this.currentTheme = this.readPreference<AdminTheme>("adminTheme", "night", ["night", "corporate"]);
    this.currentDensity = this.readPreference<AdminDensity>("adminDensity", "comfortable", ["comfortable", "compact"]);
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

  setLanguage(language: AdminLanguage): void {
    this.currentLanguage = language;
    localStorage.setItem("adminLanguage", language);
    this.applyPreferences();
    this.updateTitle();
  }

  setTheme(theme: AdminTheme): void {
    this.currentTheme = theme;
    localStorage.setItem("adminTheme", theme);
    this.applyPreferences();
  }

  setDensity(density: AdminDensity): void {
    this.currentDensity = density;
    localStorage.setItem("adminDensity", density);
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
    this.pageTitle = String(
      this.currentLanguage === "ar"
        ? data["titleAr"] || data["title"] || "لوحة التحكم"
        : data["titleEn"] || data["title"] || "Dashboard",
    );
  }

  private applyPreferences(): void {
    const root = document.documentElement;
    const body = document.body;
    root.lang = this.currentLanguage;
    root.dir = this.currentLanguage === "ar" ? "rtl" : "ltr";
    body.dataset["theme"] = this.currentTheme;
    body.classList.toggle("admin-density-compact", this.currentDensity === "compact");
  }

  private readPreference<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  }
}
