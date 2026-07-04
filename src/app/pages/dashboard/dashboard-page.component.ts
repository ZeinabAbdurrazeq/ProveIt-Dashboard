import { CommonModule } from "@angular/common";
import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { BaseChartDirective } from "ng2-charts";
import { ChartData, ChartOptions, ChartType, ChartDataset } from "chart.js";
import { forkJoin, finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import {
  DashboardStatsResponse,
  LeaderboardCandidate,
  ProblemStat,
  SubscriptionDistributionItem,
  TimeSeriesResponse,
} from "../../core/models/admin.models";

interface StatCard {
  label: string;
  value: number;
  icon: string;
  hint: string;
  gradient: string;
}

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="space-y-6">
      <section *ngIf="loading" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <div *ngFor="let _ of skeletonArray" class="admin-panel p-5">
            <div class="h-3 w-24 animate-pulse rounded-full bg-white/10"></div>
            <div
              class="mt-5 h-8 w-20 animate-pulse rounded-2xl bg-white/10"
            ></div>
            <div
              class="mt-4 h-3 w-32 animate-pulse rounded-full bg-white/10"
            ></div>
          </div>
        </div>
        <div class="grid gap-6 xl:grid-cols-2">
          <div class="admin-panel p-5">
            <div class="h-72 animate-pulse rounded-3xl bg-white/5"></div>
          </div>
          <div class="admin-panel p-5">
            <div class="h-72 animate-pulse rounded-3xl bg-white/5"></div>
          </div>
        </div>
        <div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div class="admin-panel p-5">
            <div class="h-80 animate-pulse rounded-3xl bg-white/5"></div>
          </div>
          <div class="admin-panel p-5">
            <div class="h-80 animate-pulse rounded-3xl bg-white/5"></div>
          </div>
        </div>
      </section>

      <section
        *ngIf="error"
        class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100"
      >
        <p class="text-lg font-semibold">تعذر تحميل لوحة التحكم.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
        <button
          class="admin-button mt-4"
          type="button"
          (click)="loadDashboard()"
        >
          إعادة المحاولة
        </button>
      </section>

      <section *ngIf="!loading && !error" class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <article
            *ngFor="let card of statCards"
            class="admin-panel admin-metric-card group relative overflow-hidden p-5 transition hover:-translate-y-1"
          >
            <div
              class="admin-metric-glow absolute inset-0 opacity-60"
            ></div>
            <div class="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-base-content/80">
                  {{ card.label }}
                </p>
                <p class="mt-3 text-3xl font-black tracking-tight text-white">
                  {{ formatCompact(card.value) }}
                </p>
                <p class="mt-2 text-xs text-base-content/60">{{ card.hint }}</p>
              </div>
              <div
                class="admin-metric-icon grid h-12 w-12 place-items-center rounded-2xl text-2xl shadow-lg backdrop-blur"
              >
                {{ card.icon }}
              </div>
            </div>
          </article>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <section class="admin-panel p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                  الاتجاه
                </p>
                <h2 class="mt-2 text-xl font-bold text-white">
                  الجلسات عبر الوقت
                </h2>
              </div>
              <span class="admin-chip">آخر 30 يوم</span>
            </div>
            <div class="mt-5 h-[320px]">
              <canvas
                baseChart
                [data]="sessionsChartData"
                [options]="lineChartOptions"
                [type]="lineChartType"
              ></canvas>
            </div>
          </section>

          <section class="admin-panel p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                  الاتجاه
                </p>
                <h2 class="mt-2 text-xl font-bold text-white">
                  مقابلات الذكاء يوميًا
                </h2>
              </div>
              <span class="admin-chip">آخر 30 يوم</span>
            </div>
            <div class="mt-5 h-[320px]">
              <canvas
                baseChart
                [data]="interviewsChartData"
                [options]="barChartOptions"
                [type]="barChartType"
              ></canvas>
            </div>
          </section>
        </div>

        <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section class="admin-panel p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                  الترتيب
                </p>
                <h2 class="mt-2 text-xl font-bold text-white">
                  أفضل 10 مرشحين
                </h2>
              </div>
              <span class="admin-chip">حسب متوسط التقييم</span>
            </div>

            <div
              *ngIf="topCandidates.length; else noCandidates"
              class="mt-5 overflow-x-auto rounded-3xl border border-base-300"
            >
              <table class="admin-table min-w-[760px]">
                <thead class="bg-white/5">
                  <tr>
                    <th class="admin-th">الترتيب</th>
                    <th class="admin-th">المرشح</th>
                    <th class="admin-th">المجال</th>
                    <th class="admin-th">المقابلات</th>
                    <th class="admin-th">التقييم</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10 bg-base-100">
                  <tr *ngFor="let candidate of topCandidates; index as index">
                    <td class="admin-td font-semibold text-base-content/60">
                      #{{ index + 1 }}
                    </td>
                    <td class="admin-td">
                      <div class="flex items-center gap-3">
                        <img
                          [src]="
                            candidate.userId?.profileImage || defaultAvatar
                          "
                          [alt]="candidate.userId?.name || 'Candidate'"
                          class="h-10 w-10 rounded-2xl border border-base-300 object-cover"
                        />
                        <div>
                          <p class="font-semibold text-white">
                            {{ candidate.userId?.name || "مرشح غير معروف" }}
                          </p>
                          <p class="text-xs text-base-content/60">
                            {{ candidate.userId?.email || "لا يوجد بريد" }}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td class="admin-td">
                      <span class="admin-chip">{{
                        candidate.primaryField || "general"
                      }}</span>
                    </td>
                    <td class="admin-td font-semibold text-base-content">
                      {{ candidate.totalInterviewsCompleted }}
                    </td>
                    <td class="admin-td">
                      <span
                        class="rounded-full px-3 py-1 text-xs font-bold"
                        [ngClass]="
                          scoreBadgeClass(candidate.overallAverageScore)
                        "
                      >
                        {{ formatScore(candidate.overallAverageScore) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #noCandidates>
              <div
                class="mt-5 rounded-3xl border border-dashed border-base-300 bg-white/5 p-10 text-center text-base-content/60"
              >
                لا توجد ملفات مرشحين بعد.
              </div>
            </ng-template>
          </section>

          <section class="admin-panel p-5">
            <div>
              <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">
                الاشتراكات
              </p>
              <h2 class="mt-2 text-xl font-bold text-white">
                توزيع الخطط
              </h2>
            </div>

            <div
              class="mt-5 grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3"
            >
              <article
                *ngFor="let plan of subscriptionDistribution"
                class="rounded-[1.75rem] border border-base-300 bg-white/5 p-4"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold capitalize text-white">
                      {{ plan.plan }}
                    </p>
                    <p class="text-xs text-base-content/60">{{ plan.count }} مستخدم</p>
                  </div>
                  <span class="text-sm font-semibold text-emerald-300"
                    >{{ plan.percentage }}%</span
                  >
                </div>
                <div class="mt-4 flex items-center justify-center">
                  <div
                    class="relative h-28 w-28 rounded-full"
                    [style.background]="
                      subscriptionRingStyle(plan.plan, plan.percentage)
                    "
                  >
                    <div
                      class="absolute inset-2 rounded-full bg-[#08101c] p-3 text-center"
                    >
                      <div
                        class="grid h-full place-items-center rounded-full border border-base-300 bg-white/5"
                      >
                        <div>
                          <p class="text-xl font-black text-white">
                            {{ plan.count }}
                          </p>
                          <p
                            class="text-[10px] uppercase tracking-[0.24em] text-base-content/60"
                          >
                            {{ plan.plan }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div
              class="mt-5 rounded-[1.75rem] border border-base-300 bg-white/5 p-4"
            >
              <p class="text-sm font-semibold text-white">تصنيفات المسائل</p>
              <div
                *ngIf="problemStats.length; else noProblems"
                class="mt-4 space-y-3"
              >
                <div
                  *ngFor="let item of problemStats"
                  class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-[#08101c] px-4 py-3"
                >
                  <div>
                    <p class="font-medium text-white">{{ item.category }}</p>
                    <p class="text-xs text-base-content/60">
                      {{ item.attempts }} محاولة
                    </p>
                  </div>
                  <span
                    class="rounded-full px-3 py-1 text-xs font-bold"
                    [ngClass]="scoreBadgeClass(item.averageScore)"
                  >
                    متوسط {{ formatScore(item.averageScore) }}
                  </span>
                </div>
              </div>
              <ng-template #noProblems>
                <div
                  class="mt-4 rounded-2xl border border-dashed border-base-300 bg-[#08101c] p-4 text-sm text-base-content/60"
                >
                  لا توجد إحصائيات مسائل بعد.
                </div>
              </ng-template>
            </div>
          </section>
        </div>
      </section>
    </div>
  `,
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  error = "";
  defaultAvatar =
    "https://ui-avatars.com/api/?name=Provelt&background=0f172a&color=ffffff";

  skeletonArray = Array.from({ length: 6 });

  statCards: StatCard[] = [];
  topCandidates: LeaderboardCandidate[] = [];
  subscriptionDistribution: SubscriptionDistributionItem[] = [];
  problemStats: ProblemStat[] = [];

  lineChartType: "line" = "line";
  barChartType: "bar" = "bar";

  lineChartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
        },
        ticks: {
          color: "rgba(226, 232, 240, 0.75)",
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
        },
        ticks: {
          color: "rgba(226, 232, 240, 0.75)",
        },
      },
    },
    elements: {
      line: {
        tension: 0.38,
      },
      point: {
        radius: 0,
        hoverRadius: 4,
      },
    },
  };

  barChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(226, 232, 240, 0.75)",
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
        },
        ticks: {
          color: "rgba(226, 232, 240, 0.75)",
        },
      },
    },
  };

  sessionsChartData: ChartData<"line", number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: "Sessions",
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.18)",
        fill: true,
        tension: 0.38,
        pointRadius: 0,
      },
    ],
  };

  interviewsChartData: ChartData<"bar", number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: "Interviews",
        backgroundColor: "rgba(56, 189, 248, 0.78)",
        borderRadius: 10,
        barPercentage: 0.72,
        categoryPercentage: 0.72,
      },
    ],
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = "";

    forkJoin({
      stats: this.api.getDashboardStats(),
      sessions: this.api.getSessionsOverTime(),
      interviews: this.api.getInterviewsPerDay(),
      candidates: this.api.getTopCandidates(),
      problems: this.api.getProblemsStats(),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: ({ stats, sessions, interviews, candidates, problems }) => {
          this.applyStats(stats);
          this.applySessionSeries(sessions);
          this.applyInterviewSeries(interviews);
          this.topCandidates = candidates.candidates || [];
          this.problemStats = problems.categories || [];
        },
        error: (error) => {
          this.error =
            error?.error?.msg || "The dashboard data could not be loaded.";
        },
      });
  }

  private applyStats(stats: DashboardStatsResponse): void {
    this.subscriptionDistribution = stats.subscriptionDistribution || [];

    this.statCards = [
      {
        label: "كل المستخدمين",
        value: stats.totalUsers,
        icon: "◫",
        hint: "الحسابات المسجلة في المنصة",
        gradient:
          "bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950",
      },
      {
        label: "كل الجلسات",
        value: stats.totalSessions,
        icon: "◎",
        hint: "جلسات البرمجة التي تم إنشاؤها",
        gradient:
          "bg-gradient-to-br from-violet-500/20 via-slate-900 to-slate-950",
      },
      {
        label: "مقابلات الذكاء",
        value: stats.totalInterviews,
        icon: "✦",
        hint: "المقابلات المخزنة في النظام",
        gradient:
          "bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950",
      },
      {
        label: "متوسط الذكاء",
        value: Math.round(stats.averageAiScore),
        icon: "◔",
        hint: "متوسط نتائج المقابلات المكتملة",
        gradient:
          "bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-950",
      },
      {
        label: "الاشتراكات النشطة",
        value: stats.activeSubscriptions,
        icon: "⎔",
        hint: "الخطط المدفوعة النشطة حاليًا",
        gradient:
          "bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950",
      },
      {
        label: "الدعوات المعلقة",
        value: stats.pendingInvitations,
        icon: "⌁",
        hint: "بانتظار الرد",
        gradient:
          "bg-gradient-to-br from-rose-500/20 via-slate-900 to-slate-950",
      },
    ];
  }

  private applySessionSeries(series: TimeSeriesResponse): void {
    this.sessionsChartData = {
      labels: series.series.map((point) => this.formatDate(point.date)),
      datasets: [
        {
          data: series.series.map((point) => point.count),
          label: "Sessions",
          borderColor: "#34d399",
          backgroundColor: "rgba(52, 211, 153, 0.18)",
          fill: true,
          tension: 0.38,
          pointRadius: 0,
        },
      ],
    };
  }

  private applyInterviewSeries(series: TimeSeriesResponse): void {
    this.interviewsChartData = {
      labels: series.series.map((point) => this.formatDate(point.date)),
      datasets: [
        {
          data: series.series.map((point) => point.count),
          label: "Interviews",
          backgroundColor: "rgba(56, 189, 248, 0.78)",
          borderRadius: 10,
          barPercentage: 0.72,
          categoryPercentage: 0.72,
        },
      ],
    };
  }

  formatCompact(value: number): string {
    return new Intl.NumberFormat("ar", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value || 0);
  }

  formatScore(value: number): string {
    return value >= 10 ? `${Math.round(value)}%` : value.toFixed(1);
  }

  scoreBadgeClass(value: number): string {
    const score = value >= 10 ? value : value * 10;

    if (score >= 80) {
      return "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20";
    }

    if (score >= 60) {
      return "bg-amber-400/15 text-amber-300 border border-amber-400/20";
    }

    return "bg-rose-400/15 text-rose-300 border border-rose-400/20";
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
      background: `conic-gradient(${colors[plan] || colors["free"]} ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
    };
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("ar", {
      month: "short",
      day: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  }
}
