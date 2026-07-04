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
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">التسليمات</p>
            <h2 class="mt-2 text-2xl font-bold text-white">تسليمات المسائل</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">
              تفاصيل كل محاولة: المسألة، المستخدم، اللغة، النتيجة، والنقاط المؤثرة على التقييم.
            </p>
          </div>
          <div class="grid w-full gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-[1fr_160px_160px_auto]">
            <input class="admin-input" type="text" placeholder="ابحث عن مسألة أو لغة" [(ngModel)]="searchTerm" (keydown.enter)="search()" />
            <select class="admin-input" [(ngModel)]="statusFilter" (change)="search()">
              <option value="">كل النتائج</option>
              <option value="accepted">مقبولة</option>
              <option value="rejected">مرفوضة</option>
            </select>
            <select class="admin-input" [(ngModel)]="difficultyFilter" (change)="search()">
              <option value="">كل المستويات</option>
              <option value="easy">سهل</option>
              <option value="medium">متوسط</option>
              <option value="hard">صعب</option>
            </select>
            <button class="admin-button-secondary" type="button" (click)="search()">بحث</button>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100">
        <p class="text-lg font-semibold">تعذر تحميل التسليمات.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
      </section>

      <section class="admin-panel overflow-hidden p-0">
        <div *ngIf="loading" class="p-8 text-base-content/70">جارٍ تحميل التسليمات...</div>

        <div *ngIf="!loading && submissions.length; else emptyState" class="overflow-x-auto">
          <table class="admin-table min-w-[920px]">
            <thead class="bg-white/5">
              <tr>
                <th class="admin-th">المستخدم</th>
                <th class="admin-th">المسألة</th>
                <th class="admin-th">المستوى</th>
                <th class="admin-th">اللغة</th>
                <th class="admin-th">الحالة</th>
                <th class="admin-th">النقاط</th>
                <th class="admin-th">التفاصيل</th>
                <th class="admin-th">التاريخ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-base-100">
              <tr *ngFor="let submission of submissions">
                <td class="admin-td">
                  <div class="flex items-center gap-3">
                    <img
                      [src]="submission.userId?.profileImage || defaultAvatar"
                      [alt]="submission.userId?.name || 'User'"
                      class="h-10 w-10 rounded-2xl border border-base-300 object-cover"
                    />
                    <div>
                      <p class="font-semibold text-white">{{ submission.userId?.name || 'مستخدم محذوف' }}</p>
                      <p class="text-xs text-base-content/60">{{ submission.userId?.email || 'لا يوجد بريد' }}</p>
                    </div>
                  </div>
                </td>
                <td class="admin-td">
                  <p class="font-semibold text-white">{{ submission.problemTitle }}</p>
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
                    {{ submission.accepted ? 'مقبولة' : 'مرفوضة' }}
                  </span>
                </td>
                <td class="admin-td">
                  <span class="text-lg font-black" [ngClass]="submission.scoreDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'">
                    {{ submission.scoreDelta > 0 ? '+' : '' }}{{ submission.scoreDelta }}
                  </span>
                </td>
                <td class="admin-td">
                  <div class="grid gap-1 text-xs text-base-content/70">
                    <span>حل: {{ submission.solvedPointsAwarded }}</span>
                    <span>أول محاولة: {{ submission.firstTryBonusAwarded }}</span>
                    <span>نشاط يومي: {{ submission.dailyBonusAwarded }}</span>
                    <span>خصم: {{ submission.wrongPenaltyApplied }}</span>
                  </div>
                </td>
                <td class="admin-td text-base-content/80">{{ formatDate(submission.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyState>
          <div *ngIf="!loading" class="p-12 text-center text-base-content/60">
            <p class="text-lg font-semibold text-white">لا توجد تسليمات</p>
            <p class="mt-2 text-sm">ستظهر المحاولات هنا بعد تشغيل الكود على المسائل.</p>
          </div>
        </ng-template>
      </section>

      <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-base-content/60">صفحة {{ page }} من {{ totalPages }}</p>
        <div class="flex gap-2">
          <button class="admin-button-secondary" type="button" [disabled]="page <= 1 || loading" (click)="goToPage(page - 1)">السابق</button>
          <button class="admin-button-secondary" type="button" [disabled]="page >= totalPages || loading" (click)="goToPage(page + 1)">التالي</button>
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
        status: this.statusFilter,
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
          this.error = error?.error?.msg || "تعذر تحميل التسليمات.";
        },
      });
  }

  difficultyLabel(difficulty: string): string {
    if (difficulty === "hard") return "صعب";
    if (difficulty === "medium") return "متوسط";
    return "سهل";
  }

  difficultyBadgeClass(difficulty: string): string {
    if (difficulty === "hard") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    if (difficulty === "medium") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }
}
