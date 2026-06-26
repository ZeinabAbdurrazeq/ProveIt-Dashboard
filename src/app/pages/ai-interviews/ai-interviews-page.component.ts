import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import { AdminInterview, InterviewQuestionBreakdown } from "../../core/models/admin.models";

@Component({
  selector: "app-ai-interviews-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Management</p>
            <h2 class="mt-2 text-2xl font-bold text-white">AI interviews</h2>
            <p class="mt-2 text-sm text-base-content/60">Inspect scores and expand each interview for a full question breakdown.</p>
          </div>
          <label class="flex w-full flex-col gap-2 sm:max-w-xs">
            <span class="text-sm text-base-content/60">Status filter</span>
            <select class="admin-input" [(ngModel)]="statusFilter" (change)="applyFilter()">
              <option value="all">All</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </section>

      <section *ngIf="loading" class="admin-panel p-5">
        <div class="space-y-3">
          <div *ngFor="let _ of skeletonRows" class="grid grid-cols-5 gap-4 rounded-3xl border border-base-300 bg-white/5 p-4">
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100">
        <p class="text-lg font-semibold">Couldn’t load AI interviews.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
        <button class="admin-button mt-4" type="button" (click)="loadInterviews()">Retry</button>
      </section>

      <section *ngIf="!loading && !error" class="admin-panel overflow-hidden p-0">
        <div *ngIf="interviews.length; else emptyInterviews" class="overflow-x-auto">
          <table class="admin-table">
            <thead class="bg-white/5">
              <tr>
                <th class="admin-th">Candidate</th>
                <th class="admin-th">Field</th>
                <th class="admin-th">Score</th>
                <th class="admin-th">Questions</th>
                <th class="admin-th">Status</th>
                <th class="admin-th">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-base-100">
              <ng-container *ngFor="let interview of interviews">
                <tr class="cursor-pointer transition hover:bg-white/5" (click)="toggleInterview(interview._id)">
                  <td class="admin-td">
                    <div class="flex items-center gap-3">
                      <img
                        [src]="interview.userId?.profileImage || defaultAvatar"
                        [alt]="interview.userId?.name || 'Candidate'"
                        class="h-10 w-10 rounded-2xl border border-base-300 object-cover"
                      />
                      <div>
                        <p class="font-semibold text-white">{{ interview.userId?.name || 'Unknown candidate' }}</p>
                        <p class="text-xs text-base-content/60">{{ interview.userId?.email || 'No email' }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="admin-td">
                    <span class="admin-chip capitalize">{{ getFieldLabel(interview) }}</span>
                  </td>
                  <td class="admin-td">
                    <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="scoreBadgeClass(interview.overallScore)">
                      {{ formatScore(interview.overallScore) }}
                    </span>
                  </td>
                  <td class="admin-td font-semibold text-base-content">{{ interview.questions.length }}</td>
                  <td class="admin-td">
                    <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="statusBadgeClass(interview.status)">
                      {{ interview.status }}
                    </span>
                  </td>
                  <td class="admin-td text-base-content/80">{{ formatDate(interview.createdAt) }}</td>
                </tr>
                <tr *ngIf="expandedInterviewId === interview._id">
                  <td colspan="6" class="border-t border-base-300 bg-base-200 px-4 py-5">
                    <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                      <div class="space-y-4">
                        <div>
                          <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Question breakdown</p>
                          <h3 class="mt-2 text-lg font-bold text-white">Per-question feedback</h3>
                        </div>
                        <div *ngIf="interview.questions.length; else noQuestions" class="space-y-3">
                          <article *ngFor="let question of interview.questions" class="rounded-3xl border border-base-300 bg-white/5 p-4">
                            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p class="text-sm font-semibold text-white">{{ question.questionText }}</p>
                                <p class="mt-1 text-xs uppercase tracking-[0.2em] text-base-content/60">{{ question.topic || 'general' }} · {{ question.difficulty || 'n/a' }}</p>
                              </div>
                              <span class="rounded-full px-3 py-1 text-xs font-bold" [ngClass]="scoreBadgeClass(question.score)">
                                {{ formatScore(question.score) }}
                              </span>
                            </div>
                            <p *ngIf="question.userAnswer" class="mt-3 text-sm leading-6 text-base-content/80"><span class="font-semibold text-base-content">Answer:</span> {{ question.userAnswer }}</p>
                            <p class="mt-2 text-sm leading-6 text-base-content/80"><span class="font-semibold text-base-content">AI feedback:</span> {{ question.aiFeedback || 'No feedback recorded.' }}</p>
                          </article>
                        </div>
                        <ng-template #noQuestions>
                          <div class="rounded-3xl border border-dashed border-base-300 bg-white/5 p-6 text-sm text-base-content/60">
                            This interview has no question breakdown yet.
                          </div>
                        </ng-template>
                      </div>

                      <div class="space-y-4">
                        <div>
                          <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Summary</p>
                          <h3 class="mt-2 text-lg font-bold text-white">Overall feedback</h3>
                        </div>
                        <div class="rounded-3xl border border-base-300 bg-white/5 p-5">
                          <p class="text-sm leading-7 text-base-content/80">{{ interview.overallFeedback || 'No overall feedback is available yet.' }}</p>
                        </div>
                        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                          <div class="rounded-3xl border border-base-300 bg-white/5 p-4">
                            <p class="text-xs uppercase tracking-[0.24em] text-base-content/60">Strengths</p>
                            <div class="mt-3 flex flex-wrap gap-2">
                              <span *ngFor="let item of interview.strengths" class="admin-chip">{{ item }}</span>
                              <span *ngIf="!interview.strengths.length" class="text-sm text-base-content/60">None recorded</span>
                            </div>
                          </div>
                          <div class="rounded-3xl border border-base-300 bg-white/5 p-4">
                            <p class="text-xs uppercase tracking-[0.24em] text-base-content/60">Weaknesses</p>
                            <div class="mt-3 flex flex-wrap gap-2">
                              <span *ngFor="let item of interview.weaknesses" class="admin-chip">{{ item }}</span>
                              <span *ngIf="!interview.weaknesses.length" class="text-sm text-base-content/60">None recorded</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <ng-template #emptyInterviews>
          <div class="p-12 text-center text-base-content/60">
            <p class="text-lg font-semibold text-white">No AI interviews found</p>
            <p class="mt-2 text-sm">There are no interviews for the selected filter.</p>
          </div>
        </ng-template>
      </section>

      <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-base-content/60">Page {{ page }} of {{ totalPages }}</p>
        <div class="flex gap-2">
          <button class="admin-button-secondary" type="button" [disabled]="page <= 1 || loading" (click)="goToPage(page - 1)">Previous</button>
          <button class="admin-button-secondary" type="button" [disabled]="page >= totalPages || loading" (click)="goToPage(page + 1)">Next</button>
        </div>
      </section>
    </div>
  `,
})
export class AiInterviewsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  error = "";
  page = 1;
  totalPages = 1;
  pageSize = 10;
  statusFilter = "all";
  expandedInterviewId: string | null = null;
  interviews: AdminInterview[] = [];
  defaultAvatar = "https://ui-avatars.com/api/?name=Provelt&background=0f172a&color=ffffff";
  skeletonRows = Array.from({ length: 5 });

  ngOnInit(): void {
    this.loadInterviews();
  }

  applyFilter(): void {
    this.page = 1;
    this.expandedInterviewId = null;
    this.loadInterviews();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.page = page;
    this.expandedInterviewId = null;
    this.loadInterviews();
  }

  toggleInterview(id: string): void {
    this.expandedInterviewId = this.expandedInterviewId === id ? null : id;
  }

  loadInterviews(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getAiInterviews({
        page: this.page,
        limit: this.pageSize,
        status: this.statusFilter === "all" ? "" : this.statusFilter,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.interviews = response.interviews || [];
          this.page = response.page;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          this.error = error?.error?.msg || "The AI interviews table could not be loaded.";
        },
      });
  }

  getFieldLabel(interview: AdminInterview): string {
    const field = (interview.cvAnalysis as Record<string, unknown> | undefined)?.["primaryField"];
    return typeof field === "string" && field.trim() ? field : "general";
  }

  scoreBadgeClass(value: number): string {
    const score = value >= 10 ? value : value * 10;

    if (score >= 80) {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }

    if (score >= 60) {
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    }

    return "border-rose-400/20 bg-rose-400/10 text-rose-300";
  }

  statusBadgeClass(status: string): string {
    return status === "completed"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }

  formatScore(value: number): string {
    return value >= 10 ? `${Math.round(value)}%` : value.toFixed(1);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }
}


