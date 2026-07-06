import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { finalize } from "rxjs";

import { AdminUser } from "../../core/models/admin.models";
import { AdminApiService } from "../../core/services/admin-api.service";

@Component({
  selector: "app-leaderboard-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Performance</p>
            <h2 class="mt-2 text-2xl font-bold text-base-content">Leaderboard</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">Rank users by platform score, level, and account progress.</p>
          </div>
          <button class="admin-button-secondary w-full sm:w-auto" type="button" (click)="loadLeaderboard()" [disabled]="loading">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-5 text-red-100">
        {{ error }}
      </section>

      <section *ngIf="loading" class="grid gap-4 lg:grid-cols-3">
        <div *ngFor="let _ of skeletonRows" class="admin-panel p-5">
          <div class="h-4 w-24 animate-pulse rounded-full bg-base-300"></div>
          <div class="mt-6 h-20 animate-pulse rounded-3xl bg-base-200"></div>
        </div>
      </section>

      <section *ngIf="!loading && leaders.length" class="grid gap-4 lg:grid-cols-3">
        <article *ngFor="let user of podiumUsers; let i = index" class="admin-panel leaderboard-podium p-5" [class.is-first]="i === 0">
          <div class="flex items-start justify-between gap-3">
            <span class="leaderboard-rank">#{{ i + 1 }}</span>
            <span class="admin-chip">{{ user.level || 'Entry-Level' }}</span>
          </div>
          <div class="mt-6 flex items-center gap-4">
            <img [src]="user.profileImage || defaultAvatar" [alt]="user.name" class="h-16 w-16 rounded-2xl border border-base-300 object-cover" />
            <div class="min-w-0">
              <h3 class="truncate text-xl font-black text-base-content">{{ user.name }}</h3>
              <p class="truncate text-sm text-base-content/60">{{ user.email }}</p>
            </div>
          </div>
          <p class="mt-6 text-4xl font-black text-base-content">{{ user.score || 0 }}</p>
          <p class="mt-1 text-xs uppercase tracking-[0.22em] text-base-content/55">points</p>
        </article>
      </section>

      <section class="admin-panel overflow-hidden p-0">
        <div class="border-b border-base-300 p-5">
          <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Rankings</p>
          <h3 class="mt-2 text-xl font-bold text-base-content">All ranked users</h3>
        </div>

        <div *ngIf="!loading && leaders.length; else emptyLeaderboard" class="overflow-x-auto">
          <table class="admin-table min-w-[760px]">
            <thead class="bg-base-200">
              <tr>
                <th class="admin-th">Rank</th>
                <th class="admin-th">User</th>
                <th class="admin-th">Level</th>
                <th class="admin-th">Score</th>
                <th class="admin-th">Role</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base-300 bg-base-100">
              <tr *ngFor="let user of leaders; let i = index">
                <td class="admin-td">
                  <span class="leaderboard-table-rank">#{{ i + 1 }}</span>
                </td>
                <td class="admin-td">
                  <div class="flex items-center gap-3">
                    <img [src]="user.profileImage || defaultAvatar" [alt]="user.name" class="h-11 w-11 rounded-2xl border border-base-300 object-cover" />
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-base-content">{{ user.name }}</p>
                      <p class="truncate text-xs text-base-content/60">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="admin-td text-base-content/80">{{ user.level || 'Entry-Level' }}</td>
                <td class="admin-td">
                  <span class="text-lg font-black text-base-content">{{ user.score || 0 }}</span>
                </td>
                <td class="admin-td">
                  <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="user.role === 'admin' ? 'border-primary/25 bg-primary/10 text-primary' : 'border-base-300 bg-base-200 text-base-content/70'">
                    {{ user.role === 'admin' ? 'Admin' : 'User' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyLeaderboard>
          <div *ngIf="!loading" class="p-12 text-center text-base-content/60">
            <p class="text-lg font-semibold text-base-content">No ranked users yet</p>
            <p class="mt-2 text-sm">Users will appear here once score data is available.</p>
          </div>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .leaderboard-podium {
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--admin-primary) 14%, transparent), transparent 42%),
        var(--admin-surface);
    }

    .leaderboard-podium.is-first {
      border-color: color-mix(in srgb, var(--admin-warning) 42%, var(--admin-border));
    }

    .leaderboard-rank {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--admin-primary) 25%, transparent);
      background: color-mix(in srgb, var(--admin-primary) 12%, transparent);
      color: var(--admin-primary);
      padding: 0.45rem 0.8rem;
      font-size: 0.9rem;
      font-weight: 900;
    }

    .leaderboard-table-rank {
      display: inline-flex;
      min-width: 3rem;
      justify-content: center;
      border-radius: 999px;
      background: color-mix(in srgb, var(--admin-muted) 12%, transparent);
      padding: 0.35rem 0.7rem;
      font-weight: 900;
    }
  `],
})
export class LeaderboardPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  error = "";
  leaders: AdminUser[] = [];
  skeletonRows = Array.from({ length: 3 });
  defaultAvatar = "https://ui-avatars.com/api/?name=Provelt&background=0f172a&color=ffffff";

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  get podiumUsers(): AdminUser[] {
    return this.leaders.slice(0, 3);
  }

  loadLeaderboard(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getUsers({ page: 1, limit: 100 })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.leaders = [...(response.users || [])].sort(
            (a, b) =>
              Number(b.score || 0) - Number(a.score || 0) ||
              a.name.localeCompare(b.name),
          );
        },
        error: (error) => {
          this.error = error?.error?.msg || "Leaderboard data could not be loaded.";
        },
      });
  }
}
