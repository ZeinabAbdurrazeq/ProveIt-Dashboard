import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import {
  DashboardStatsResponse,
  SubscriptionDistributionItem,
} from "../../core/models/admin.models";

@Component({
  selector: "app-subscriptions-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <section *ngIf="loading" class="grid gap-4 md:grid-cols-3">
        <div *ngFor="let _ of skeletonArray" class="admin-panel p-5">
          <div class="h-3 w-24 animate-pulse rounded-full bg-base-300"></div>
          <div class="mt-6 h-32 animate-pulse rounded-3xl bg-base-200"></div>
        </div>
      </section>

      <section
        *ngIf="error"
        class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100"
      >
        <p class="text-lg font-semibold">Could not load subscriptions.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
        <button class="admin-button mt-4" type="button" (click)="loadSubscriptions()">
          Retry
        </button>
      </section>

      <section *ngIf="!loading && !error" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="admin-panel p-5">
            <p class="text-sm font-medium text-base-content/70">Active subscriptions</p>
            <p class="mt-3 text-3xl font-black text-base-content">
              {{ stats?.activeSubscriptions || 0 }}
            </p>
            <p class="mt-2 text-xs text-base-content/60">Paid plans currently active</p>
          </article>

          <article class="admin-panel p-5">
            <p class="text-sm font-medium text-base-content/70">Tracked users</p>
            <p class="mt-3 text-3xl font-black text-base-content">
              {{ totalSubscriptionUsers }}
            </p>
            <p class="mt-2 text-xs text-base-content/60">Users included in plan distribution</p>
          </article>

          <article class="admin-panel p-5">
            <p class="text-sm font-medium text-base-content/70">Paid ratio</p>
            <p class="mt-3 text-3xl font-black text-base-content">{{ paidRatio }}%</p>
            <p class="mt-2 text-xs text-base-content/60">Pro and premium share</p>
          </article>

          <article class="admin-panel p-5">
            <p class="text-sm font-medium text-base-content/70">Plans</p>
            <p class="mt-3 text-3xl font-black text-base-content">
              {{ subscriptionDistribution.length }}
            </p>
            <p class="mt-2 text-xs text-base-content/60">Distribution groups returned by backend</p>
          </article>
        </div>

        <div class="grid gap-5 md:grid-cols-3">
          <article
            *ngFor="let plan of subscriptionDistribution"
            class="admin-panel p-5"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                  Plan
                </p>
                <h2 class="mt-2 text-2xl font-bold capitalize text-base-content">
                  {{ plan.plan }}
                </h2>
              </div>
              <span class="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-sm font-bold text-success">
                {{ plan.percentage }}%
              </span>
            </div>

            <div class="mt-6 flex items-center justify-center">
              <div
                class="relative h-40 w-40 rounded-full"
                [style.background]="subscriptionRingStyle(plan.plan, plan.percentage)"
              >
                <div class="absolute inset-3 rounded-full bg-base-100 p-4 text-center shadow-inner">
                  <div class="grid h-full place-items-center rounded-full border border-base-300 bg-base-200">
                    <div>
                      <p class="text-3xl font-black text-base-content">
                        {{ plan.count }}
                      </p>
                      <p class="mt-1 text-xs uppercase tracking-[0.24em] text-base-content/60">
                        users
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 h-3 overflow-hidden rounded-full bg-base-200">
              <div
                class="h-full rounded-full bg-primary"
                [style.width.%]="plan.percentage"
              ></div>
            </div>
          </article>
        </div>

        <section class="admin-panel p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                Distribution
              </p>
              <h2 class="mt-2 text-xl font-bold text-base-content">
                Subscription plans
              </h2>
            </div>
            <span class="admin-chip">Backend live data</span>
          </div>

          <div class="mt-5 overflow-x-auto rounded-3xl border border-base-300">
            <table class="admin-table min-w-[640px]">
              <thead class="bg-base-200">
                <tr>
                  <th class="admin-th">Plan</th>
                  <th class="admin-th">Users</th>
                  <th class="admin-th">Percentage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-base-300 bg-base-100">
                <tr *ngFor="let plan of subscriptionDistribution">
                  <td class="admin-td font-semibold capitalize">{{ plan.plan }}</td>
                  <td class="admin-td">{{ plan.count }}</td>
                  <td class="admin-td">{{ plan.percentage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  `,
})
export class SubscriptionsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  error = "";
  stats: DashboardStatsResponse | null = null;
  subscriptionDistribution: SubscriptionDistributionItem[] = [];
  skeletonArray = Array.from({ length: 3 });

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getDashboardStats()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.subscriptionDistribution = stats.subscriptionDistribution || [];
        },
        error: (error) => {
          this.error =
            error?.error?.msg || "Subscription data could not be loaded.";
        },
      });
  }

  get totalSubscriptionUsers(): number {
    return this.subscriptionDistribution.reduce(
      (total, plan) => total + Number(plan.count || 0),
      0,
    );
  }

  get paidRatio(): number {
    const total = this.totalSubscriptionUsers;
    if (!total) return 0;

    const paid = this.subscriptionDistribution
      .filter((plan) => plan.plan !== "free")
      .reduce((sum, plan) => sum + Number(plan.count || 0), 0);

    return Math.round((paid / total) * 1000) / 10;
  }

  subscriptionRingStyle(
    plan: string,
    percentage: number,
  ): Record<string, string> {
    const value = Math.max(0, Math.min(percentage || 0, 100));
    const colors: Record<string, string> = {
      free: "rgba(148, 163, 184, 0.95)",
      pro: "rgba(16, 185, 129, 0.95)",
      premium: "rgba(59, 130, 246, 0.95)",
    };

    return {
      background: `conic-gradient(${colors[plan] || colors["free"]} ${value * 3.6}deg, color-mix(in srgb, var(--admin-muted) 18%, transparent) 0deg)`,
    };
  }
}
