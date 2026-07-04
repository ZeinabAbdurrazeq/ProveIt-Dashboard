import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import { AdminSession } from "../../core/models/admin.models";

@Component({
  selector: "app-sessions-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Management</p>
            <h2 class="mt-2 text-2xl font-bold text-white">Sessions</h2>
            <p class="mt-2 text-sm text-base-content/60">Filter sessions and inspect host and participant details.</p>
          </div>
          <label class="flex w-full flex-col gap-2 sm:max-w-xs">
            <span class="text-sm text-base-content/60">Status filter</span>
            <select class="admin-input" [(ngModel)]="statusFilter" (change)="applyFilter()">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </section>

      <section *ngIf="loading" class="admin-panel p-5">
        <div class="space-y-3">
          <div *ngFor="let _ of skeletonRows" class="grid grid-cols-6 gap-4 rounded-3xl border border-base-300 bg-white/5 p-4">
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100">
        <p class="text-lg font-semibold">Could not load sessions.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
        <button class="admin-button mt-4" type="button" (click)="loadSessions()">Retry</button>
      </section>

      <section *ngIf="!loading && !error" class="admin-panel overflow-hidden p-0">
        <div *ngIf="sessions.length; else emptySessions" class="overflow-x-auto">
          <table class="admin-table min-w-[760px]">
            <thead class="bg-white/5">
              <tr>
                <th class="admin-th">Host</th>
                <th class="admin-th">Participant</th>
                <th class="admin-th">Problem</th>
                <th class="admin-th">Difficulty</th>
                <th class="admin-th">Status</th>
                <th class="admin-th">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-base-100">
              <tr *ngFor="let session of sessions">
                <td class="admin-td">
                  <div class="flex items-center gap-3">
                    <img [src]="session.host?.profileImage || defaultAvatar" [alt]="session.host?.name || 'Host'" class="h-10 w-10 rounded-2xl border border-base-300 object-cover" />
                    <div>
                      <p class="font-semibold text-white">{{ session.host?.name || 'Unknown host' }}</p>
                      <p class="text-xs text-base-content/60">{{ session.host?.email || '-' }}</p>
                    </div>
                  </div>
                </td>
                <td class="admin-td">
                  <div class="flex items-center gap-3">
                    <img [src]="session.participant?.profileImage || defaultAvatar" [alt]="session.participant?.name || 'Participant'" class="h-10 w-10 rounded-2xl border border-base-300 object-cover" />
                    <div>
                      <p class="font-semibold text-white">{{ session.participant?.name || 'Pending participant' }}</p>
                      <p class="text-xs text-base-content/60">{{ session.participant?.email || 'Waiting for join' }}</p>
                    </div>
                  </div>
                </td>
                <td class="admin-td text-base-content/80">{{ session.problem }}</td>
                <td class="admin-td">
                  <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="difficultyBadgeClass(session.difficulty)">
                    {{ difficultyLabel(session.difficulty) }}
                  </span>
                </td>
                <td class="admin-td">
                  <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="statusBadgeClass(session.status)">
                    {{ statusLabel(session.status) }}
                  </span>
                </td>
                <td class="admin-td text-base-content/80">{{ formatDate(session.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptySessions>
          <div class="p-12 text-center text-base-content/60">
            <p class="text-lg font-semibold text-white">No sessions found</p>
            <p class="mt-2 text-sm">There are no sessions for the selected filter.</p>
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
export class SessionsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  error = "";
  page = 1;
  totalPages = 1;
  pageSize = 10;
  statusFilter = "all";
  sessions: AdminSession[] = [];
  defaultAvatar = "https://ui-avatars.com/api/?name=Provelt&background=0f172a&color=ffffff";
  skeletonRows = Array.from({ length: 5 });

  ngOnInit(): void {
    this.loadSessions();
  }

  applyFilter(): void {
    this.page = 1;
    this.loadSessions();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.page = page;
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getSessions({
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
          this.sessions = response.sessions || [];
          this.page = response.page;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          this.error = error?.error?.msg || "The sessions table could not be loaded.";
        },
      });
  }

  difficultyBadgeClass(difficulty: string): string {
    if (difficulty === "hard") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    }

    if (difficulty === "medium") {
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    }

    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  difficultyLabel(difficulty: string): string {
    if (difficulty === "hard") return "Hard";
    if (difficulty === "medium") return "Medium";
    return "Easy";
  }

  statusLabel(status: string): string {
    return status === "completed" ? "Completed" : "Active";
  }

  statusBadgeClass(status: string): string {
    return status === "completed"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : "border-sky-400/20 bg-sky-400/10 text-sky-300";
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
