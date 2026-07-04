import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject } from "@angular/core";
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

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-base-300 text-base-content">
      <div class="flex min-h-screen">
        <div
          class="fixed inset-0 z-40 bg-base-300/70 backdrop-blur-sm transition-opacity lg:hidden"
          [class.pointer-events-none]="!mobileMenuOpen"
          [class.opacity-0]="!mobileMenuOpen"
          [class.opacity-100]="mobileMenuOpen"
          (click)="closeMobileMenu()"
        ></div>

        <aside
          class="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-base-300 bg-base-100/95 px-5 py-6 transition-all duration-300 lg:static lg:z-auto lg:translate-x-0"
          [class.translate-x-full]="!mobileMenuOpen"
          [class.translate-x-0]="mobileMenuOpen"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-xl font-black text-base-content shadow-glow">
                P
              </div>
              <div class="min-w-0">
                <p class="text-xl font-extrabold tracking-tight">ProveIt</p>
                <p class="text-xs uppercase tracking-[0.25em] text-base-content/60">لوحة الإدارة</p>
              </div>
            </div>
          </div>

          <nav class="mt-8 flex-1 space-y-2 overflow-y-auto">
            <a
              *ngFor="let item of navItems"
              [routerLink]="item.path"
              routerLinkActive="bg-white/10 text-white border-emerald-400/50"
              [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
              class="group flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-base-content/80 transition hover:border-base-300 hover:bg-white/5 hover:text-white"
              (click)="closeMobileMenu()"
            >
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-lg transition group-hover:bg-white/10">{{ item.icon }}</span>
              <span class="whitespace-nowrap">{{ item.label }}</span>
            </a>
          </nav>

          <div class="space-y-3 border-t border-base-300 pt-4">
            <div class="rounded-2xl border border-base-300 bg-white/5 p-4">
              <p class="text-sm font-semibold text-white">صلاحيات الإدارة</p>
              <p class="mt-1 text-xs leading-5 text-base-content/60">الجلسة مشتركة مع Clerk في الموقع الرئيسي.</p>
            </div>
            <a class="admin-button-secondary w-full justify-start" [href]="mainAppUrl">
              <span>↗</span>
              <span>العودة للموقع</span>
            </a>
            <button class="admin-button-secondary w-full justify-start" type="button" (click)="logout()">
              <span>⎋</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        <div class="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-0">
          <header class="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <button class="admin-button-secondary lg:hidden" type="button" (click)="mobileMenuOpen = true">☰</button>
                <div>
                  <p class="text-xs uppercase tracking-[0.28em] text-base-content/60">{{ pageTitle }}</p>
                  <h1 class="text-2xl font-bold tracking-tight text-white sm:text-3xl">{{ pageTitle }}</h1>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span class="admin-chip">مدير</span>
                <span class="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-300 sm:inline-flex">
                  {{ adminEmail }}
                </span>
              </div>
            </div>
          </header>

          <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
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

  navItems: NavItem[] = [
    { label: "الرئيسية", path: "/dashboard", icon: "▣" },
    { label: "المستخدمون", path: "/users", icon: "◫" },
    { label: "الجلسات", path: "/sessions", icon: "◎" },
    { label: "مقابلات الذكاء", path: "/ai-interviews", icon: "✦" },
    { label: "المسائل", path: "/problems", icon: "⌘" },
    { label: "التسليمات", path: "/submissions", icon: "✓" },
    { label: "المدونة", path: "/blog-posts", icon: "✎" },
  ];

  ngOnInit(): void {
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

    this.pageTitle = String(route.snapshot.data["title"] || "لوحة التحكم");
  }
}
