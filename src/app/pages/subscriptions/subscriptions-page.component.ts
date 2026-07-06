import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import {
  DashboardStatsResponse,
  SubscriptionPlan,
  SubscriptionDistributionItem,
} from "../../core/models/admin.models";

type PlanDefinition = {
  key: SubscriptionPlan;
  name: string;
  price: string;
  billing: string;
  allowance: string;
  features: string[];
  recommended?: boolean;
  hidden?: boolean;
};

const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "free",
    name: "Free",
    price: "$0.00",
    billing: "forever",
    allowance: "0 AI interviews/month",
    features: [
      "Unlimited coding problems",
      "Unlimited live sessions",
      "Basic progress tracking",
      "AI interviews sold separately",
    ],
  },
  {
    key: "singleInterview",
    name: "AI Interview",
    price: "$10.00",
    billing: "per interview",
    allowance: "1 CV-aware AI interview credit",
    features: [
      "One CV-aware AI interview",
      "Detailed scorecard",
      "Role-focused questions",
      "Problems and sessions stay free",
    ],
    recommended: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "$70.00",
    billing: "per month",
    allowance: "10 AI interviews/month",
    features: [
      "10 AI interviews per month",
      "Unlimited CV re-uploads",
      "Advanced analytics",
      "Early access to new features",
      "Priority support",
    ],
  },
  {
    key: "pro",
    name: "Legacy Pro",
    price: "$9.99",
    billing: "per month",
    allowance: "10 AI interviews/month",
    features: ["Legacy paid plan"],
    hidden: true,
  },
];

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
            <p class="text-sm font-medium text-base-content/70">Active paid access</p>
            <p class="mt-3 text-3xl font-black text-base-content">
              {{ stats?.activeSubscriptions || 0 }}
            </p>
            <p class="mt-2 text-xs text-base-content/60">Premium, legacy Pro, or interview credits</p>
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
            <p class="mt-2 text-xs text-base-content/60">AI Interview, Premium, and legacy Pro share</p>
          </article>

          <article class="admin-panel p-5">
            <p class="text-sm font-medium text-base-content/70">Plans</p>
            <p class="mt-3 text-3xl font-black text-base-content">
              {{ visiblePlans.length }}
            </p>
            <p class="mt-2 text-xs text-base-content/60">Current public plan options</p>
          </article>
        </div>

        <div class="grid gap-5 lg:grid-cols-3">
          <article
            *ngFor="let plan of visiblePlans"
            class="admin-panel flex flex-col p-5"
            [ngClass]="plan.recommended ? 'border-primary/35 shadow-lg shadow-primary/10' : ''"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                  {{ plan.billing }}
                </p>
                <h2 class="mt-2 text-2xl font-bold text-base-content">
                  {{ plan.name }}
                </h2>
              </div>
              <span
                class="rounded-full border px-3 py-1 text-sm font-bold"
                [ngClass]="plan.recommended ? 'border-primary/25 bg-primary/10 text-primary' : 'border-base-300 bg-base-200 text-base-content/70'"
              >
                {{ plan.recommended ? 'Current offer' : plan.price }}
              </span>
            </div>

            <div class="mt-5">
              <p class="text-4xl font-black text-base-content">{{ plan.price }}</p>
              <p class="mt-1 text-sm font-semibold text-base-content/65">{{ plan.allowance }}</p>
            </div>

            <ul class="mt-5 flex-1 space-y-3">
              <li *ngFor="let feature of plan.features" class="flex gap-2 text-sm text-base-content/75">
                <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <div class="mt-6 rounded-3xl border border-base-300 bg-base-200/70 p-4">
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-semibold text-base-content/70">Users in admin data</span>
                <span class="text-xl font-black text-base-content">{{ distributionFor(plan.key).count }}</span>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-base-100">
                <div
                  class="h-full rounded-full"
                  [style.background]="planColor(plan.key)"
                  [style.width.%]="distributionFor(plan.key).percentage"
                ></div>
              </div>
              <p class="mt-2 text-xs text-base-content/55">{{ distributionFor(plan.key).percentage }}% of tracked subscriptions</p>
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
                <tr *ngFor="let plan of allPlanRows">
                  <td class="admin-td">
                    <div>
                      <p class="font-semibold text-base-content">{{ plan.name }}</p>
                      <p class="mt-1 text-xs text-base-content/55">{{ plan.hidden ? 'Hidden legacy plan' : plan.billing }}</p>
                    </div>
                  </td>
                  <td class="admin-td">{{ distributionFor(plan.key).count }}</td>
                  <td class="admin-td">{{ distributionFor(plan.key).percentage }}%</td>
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

  get visiblePlans(): PlanDefinition[] {
    return PLAN_DEFINITIONS.filter((plan) => !plan.hidden);
  }

  get allPlanRows(): PlanDefinition[] {
    return PLAN_DEFINITIONS;
  }

  distributionFor(plan: SubscriptionPlan): SubscriptionDistributionItem {
    return (
      this.subscriptionDistribution.find((item) => item.plan === plan) || {
        plan,
        count: 0,
        percentage: 0,
      }
    );
  }

  planColor(plan: string): string {
    const colors: Record<string, string> = {
      free: "rgba(148, 163, 184, 0.95)",
      singleInterview: "rgba(139, 92, 246, 0.95)",
      pro: "rgba(16, 185, 129, 0.95)",
      premium: "rgba(59, 130, 246, 0.95)",
    };

    return colors[plan] || colors["free"];
  }
}
