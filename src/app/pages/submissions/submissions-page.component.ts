import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminCodeSubmission } from "../../core/models/admin.models";
import { AdminApiService } from "../../core/services/admin-api.service";

@Component({
  selector: "app-submissions-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Submissions</p>
            <h2 class="mt-2 text-2xl font-bold text-base-content">Problem submissions</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">
              Inspect each attempt with problem, user, language, result, and scoring details.
            </p>
          </div>
          <div class="grid w-full gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-[1fr_160px_auto]">
            <input class="admin-input" type="text" placeholder="Search problem or language" [(ngModel)]="searchTerm" (keydown.enter)="search()" />
            <select class="select select-bordered w-full" [(ngModel)]="difficultyFilter" (change)="search()">
              <option value="">All levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button class="admin-button-secondary" type="button" (click)="search()">Search</button>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100">
        <p class="text-lg font-semibold">Could not load submissions.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
      </section>

      <section class="admin-panel overflow-hidden p-0">
        <div *ngIf="loading" class="p-8 text-base-content/70">Loading submissions...</div>

        <div *ngIf="!loading && submissions.length; else emptyState" class="overflow-x-auto">
          <table class="admin-table min-w-[920px]">
            <thead class="bg-base-200">
              <tr>
                <th class="admin-th">User</th>
                <th class="admin-th">Problem</th>
                <th class="admin-th">Difficulty</th>
                <th class="admin-th">Language</th>
                <th class="admin-th">Status</th>
                <th class="admin-th">Score</th>
                <th class="admin-th">Details</th>
                <th class="admin-th">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-300 bg-base-100">
              <tr *ngFor="let submission of submissions">
                <td class="admin-td">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="submission.userId?.profileImage || defaultAvatar"
                      [alt]="submission.userId?.name || 'User'"
                      class="h-10 w-10 rounded-2xl border border-base-300 object-cover"
                    />
                    <div>
                      <p class="font-semibold text-base-content">{{ submission.userId?.name || 'Deleted user' }}</p>
                      <p class="text-xs text-base-content/60">{{ submission.userId?.email || 'No email' }}</p>
                    </div>
                  </div>
                </td>
                <td class="admin-td">
                  <p class="font-semibold text-base-content">{{ submission.problemTitle }}</p>
                  <p class="font-mono text-xs text-base-content/60">{{ submission.problemId }}</p>
                </td>
                <td class="admin-td">
                  <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="difficultyBadgeClass(submission.difficulty)">
                    {{ difficultyLabel(submission.difficulty) }}
                  </span>
                </td>
                <td class="admin-td font-mono text-base-content/80">{{ submission.language || '-' }}</td>
                <td class="admin-td">
                  <span class="rounded-full border px-3 py-1 text-xs font-bold" [ngClass]="submission.accepted ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'">
                    {{ submission.accepted ? 'Accepted' : 'Rejected' }}
                  </span>
                </td>
                <td class="admin-td">
                  <span class="text-lg font-black" [ngClass]="submission.scoreDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'">
                    {{ submission.scoreDelta > 0 ? '+' : '' }}{{ submission.scoreDelta }}
                  </span>
                </td>
                <td class="admin-td">
                  <div class="grid gap-1 text-xs text-base-content/70">
                    <span>Solved: {{ submission.solvedPointsAwarded }}</span>
                    <span>First try: {{ submission.firstTryBonusAwarded }}</span>
                    <span>Daily bonus: {{ submission.dailyBonusAwarded }}</span>
                    <span>Penalty: {{ submission.wrongPenaltyApplied }}</span>
                  </div>
                </td>
                <td class="admin-td text-base-content/80">{{ formatDate(submission.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyState>
          <div *ngIf="!loading" class="p-12 text-center text-base-content/60">
            <p class="text-lg font-semibold text-base-content">No submissions found</p>
            <p class="mt-2 text-sm">Attempts will appear here after users run code on problems.</p>
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
export class SubmissionsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  error = "";
  page = 1;
  totalPages = 1;
  pageSize = 10;
  searchTerm = "";
  statusFilter = "";
  difficultyFilter = "";
  submissions: AdminCodeSubmission[] = [];
  defaultAvatar = "https://ui-avatars.com/api/?name=Provelt&background=0f172a&color=ffffff";

  ngOnInit(): void {
    this.loadSubmissions();
  }

  search(): void {
    this.page = 1;
    this.loadSubmissions();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getSubmissions({
        page: this.page,
        limit: this.pageSize,
        search: this.searchTerm.trim(),
        difficulty: this.difficultyFilter,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.submissions = response.submissions || [];
          this.page = response.page;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          this.error = error?.error?.msg || "Could not load submissions.";
        },
      });
  }

  difficultyLabel(difficulty: string): string {
    if (difficulty === "hard") return "Hard";
    if (difficulty === "medium") return "Medium";
    return "Easy";
  }

  difficultyBadgeClass(difficulty: string): string {
    if (difficulty === "hard") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    if (difficulty === "medium") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
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
