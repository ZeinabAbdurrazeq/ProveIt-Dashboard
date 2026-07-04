import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import { AdminProblem, AdminProblemExample, ProblemDifficulty } from "../../core/models/admin.models";

type ProblemForm = {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  category: string;
  descriptionText: string;
  notesText: string;
  constraintsText: string;
  examplesText: string;
  javascriptStarter: string;
  pythonStarter: string;
  javaStarter: string;
  javascriptExpected: string;
  pythonExpected: string;
  javaExpected: string;
  active: boolean;
};

const emptyForm = (): ProblemForm => ({
  id: "",
  title: "",
  difficulty: "Easy",
  category: "General",
  descriptionText: "",
  notesText: "",
  constraintsText: "",
  examplesText: "",
  javascriptStarter: "",
  pythonStarter: "",
  javaStarter: "",
  javascriptExpected: "",
  pythonExpected: "",
  javaExpected: "",
  active: true,
});

@Component({
  selector: "app-problems-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">بنك المسائل</p>
            <h2 class="mt-2 text-2xl font-bold text-white">المسائل</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">إنشاء وتحديث وأرشفة وحذف مسائل البرمجة الخاصة بالمنصة.</p>
          </div>
          <div class="grid w-full gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-[1fr_160px_auto_auto]">
            <input class="admin-input" type="text" placeholder="ابحث بالعنوان أو المعرف أو التصنيف" [(ngModel)]="searchTerm" (keydown.enter)="search()" />
            <select class="admin-input sm:max-w-44" [(ngModel)]="difficultyFilter" (change)="search()">
              <option value="">كل المستويات</option>
              <option value="Easy">سهل</option>
              <option value="Medium">متوسط</option>
              <option value="Hard">صعب</option>
            </select>
            <button class="admin-button-secondary" type="button" (click)="search()">بحث</button>
            <button class="admin-button" type="button" (click)="startCreate()">مسألة جديدة</button>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-5 text-red-100">
        {{ error }}
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)]">
        <div class="space-y-6">
          <div class="admin-panel overflow-hidden p-0">
            <div *ngIf="loading" class="p-8 text-base-content/70">جارٍ تحميل المسائل...</div>

            <div *ngIf="!loading && problems.length === 0" class="p-10 text-center text-base-content/60">
              <p class="text-lg font-semibold text-white">لا توجد مسائل</p>
              <p class="mt-2 text-sm">أنشئ أول مسألة من المحرر.</p>
            </div>

            <div *ngIf="!loading && problems.length" class="divide-y divide-white/10">
              <article *ngFor="let problem of problems" class="p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="admin-chip">{{ problem.category || 'عام' }}</span>
                      <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]" [ngClass]="difficultyBadgeClass(problem.difficulty)">
                        {{ difficultyLabel(problem.difficulty) }}
                      </span>
                      <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]" [ngClass]="problem.active ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-400/20 bg-slate-400/10 text-slate-300'">
                        {{ problem.active ? 'نشطة' : 'مؤرشفة' }}
                      </span>
                    </div>
                    <h3 class="mt-3 break-words text-xl font-bold text-white">{{ problem.title }}</h3>
                    <p class="mt-2 break-words text-sm text-base-content/65">{{ problem.description.text || 'لا يوجد وصف بعد.' }}</p>
                    <p class="mt-2 font-mono text-xs text-base-content/45">/{{ problem.id }}</p>
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-2">
                    <button class="admin-button-secondary" type="button" (click)="startEdit(problem)">تعديل</button>
                    <button class="admin-button-secondary" type="button" (click)="toggleActive(problem)">
                      {{ problem.active ? 'أرشفة' : 'تفعيل' }}
                    </button>
                    <button class="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100" type="button" (click)="deleteProblem(problem)">حذف</button>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-base-content/60">صفحة {{ page }} من {{ totalPages }}</p>
            <div class="flex gap-2">
              <button class="admin-button-secondary" type="button" [disabled]="page <= 1 || loading" (click)="goToPage(page - 1)">السابق</button>
              <button class="admin-button-secondary" type="button" [disabled]="page >= totalPages || loading" (click)="goToPage(page + 1)">التالي</button>
            </div>
          </section>
        </div>

        <form class="admin-panel problem-editor-panel space-y-5 p-5" (ngSubmit)="saveProblem()">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/70">{{ editingId ? 'تعديل مسألة' : 'إنشاء مسألة' }}</p>
            <h3 class="mt-2 text-xl font-bold text-white">{{ form.title || 'مسألة بدون عنوان' }}</h3>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="problem-field-label">العنوان</span>
              <input class="admin-input" required [(ngModel)]="form.title" name="title" (ngModelChange)="syncId()" />
            </label>
            <label class="space-y-2">
              <span class="problem-field-label">معرف المسألة</span>
              <input class="admin-input font-mono" required [(ngModel)]="form.id" name="problemId" (ngModelChange)="idTouched = true" />
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="problem-field-label">المستوى</span>
              <select class="admin-input" [(ngModel)]="form.difficulty" name="difficulty">
                <option value="Easy">سهل</option>
                <option value="Medium">متوسط</option>
                <option value="Hard">صعب</option>
              </select>
            </label>
            <label class="space-y-2">
              <span class="problem-field-label">التصنيف</span>
              <input class="admin-input" [(ngModel)]="form.category" name="category" />
            </label>
          </div>

          <label class="block space-y-2">
            <span class="problem-field-label">الوصف</span>
            <textarea class="admin-input min-h-28" required [(ngModel)]="form.descriptionText" name="descriptionText"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="problem-field-label">الملاحظات</span>
            <textarea class="admin-input min-h-20" placeholder="ملاحظة واحدة في كل سطر" [(ngModel)]="form.notesText" name="notesText"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="problem-field-label">الأمثلة</span>
            <textarea class="admin-input min-h-24" placeholder="input | output | explanation" [(ngModel)]="form.examplesText" name="examplesText"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="problem-field-label">القيود</span>
            <textarea class="admin-input min-h-20" placeholder="قيد واحد في كل سطر" [(ngModel)]="form.constraintsText" name="constraintsText"></textarea>
          </label>

          <div class="space-y-3">
            <h4 class="font-bold text-white">كود البداية</h4>
            <textarea class="admin-input min-h-32 font-mono text-xs" placeholder="JavaScript starter" [(ngModel)]="form.javascriptStarter" name="javascriptStarter"></textarea>
            <textarea class="admin-input min-h-32 font-mono text-xs" placeholder="Python starter" [(ngModel)]="form.pythonStarter" name="pythonStarter"></textarea>
            <textarea class="admin-input min-h-32 font-mono text-xs" placeholder="Java starter" [(ngModel)]="form.javaStarter" name="javaStarter"></textarea>
          </div>

          <div class="space-y-3">
            <h4 class="font-bold text-white">الناتج المتوقع</h4>
            <textarea class="admin-input min-h-20 font-mono text-xs" placeholder="JavaScript expected output" [(ngModel)]="form.javascriptExpected" name="javascriptExpected"></textarea>
            <textarea class="admin-input min-h-20 font-mono text-xs" placeholder="Python expected output" [(ngModel)]="form.pythonExpected" name="pythonExpected"></textarea>
            <textarea class="admin-input min-h-20 font-mono text-xs" placeholder="Java expected output" [(ngModel)]="form.javaExpected" name="javaExpected"></textarea>
          </div>

          <label class="flex items-center gap-3">
            <input type="checkbox" class="toggle toggle-success" [(ngModel)]="form.active" name="active" />
            <span class="font-semibold text-base-content/80">نشطة</span>
          </label>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button class="admin-button-secondary" type="button" (click)="resetForm()">إعادة ضبط</button>
            <button class="admin-button" type="submit" [disabled]="saving">
              {{ saving ? 'جارٍ الحفظ...' : 'حفظ المسألة' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .problem-editor-panel {
      background: linear-gradient(180deg, hsl(var(--b1)) 0%, hsl(var(--b2) / 0.7) 100%);
    }

    .problem-editor-panel .admin-input {
      border-color: hsl(var(--bc) / 0.18);
      background: hsl(var(--b2));
      box-shadow: inset 0 1px 0 hsl(var(--bc) / 0.04);
    }

    .problem-editor-panel textarea.admin-input {
      line-height: 1.55;
    }

    .problem-field-label {
      display: inline-flex;
      color: hsl(var(--bc) / 0.86);
      font-size: 0.875rem;
      font-weight: 700;
    }
  `],
})
export class ProblemsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  saving = false;
  error = "";
  page = 1;
  totalPages = 1;
  pageSize = 10;
  searchTerm = "";
  difficultyFilter = "";
  editingId = "";
  idTouched = false;
  problems: AdminProblem[] = [];
  form: ProblemForm = emptyForm();

  ngOnInit(): void {
    this.loadProblems();
  }

  search(): void {
    this.page = 1;
    this.loadProblems();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadProblems();
  }

  startCreate(): void {
    this.resetForm();
  }

  startEdit(problem: AdminProblem): void {
    this.editingId = problem._id;
    this.idTouched = true;
    this.form = {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      category: problem.category,
      descriptionText: problem.description?.text || "",
      notesText: (problem.description?.notes || []).join("\n"),
      constraintsText: (problem.constraints || []).join("\n"),
      examplesText: (problem.examples || [])
        .map((example) => [example.input, example.output, example.explanation || ""].join(" | "))
        .join("\n"),
      javascriptStarter: problem.starterCode?.javascript || "",
      pythonStarter: problem.starterCode?.python || "",
      javaStarter: problem.starterCode?.java || "",
      javascriptExpected: problem.expectedOutput?.javascript || "",
      pythonExpected: problem.expectedOutput?.python || "",
      javaExpected: problem.expectedOutput?.java || "",
      active: problem.active,
    };
  }

  saveProblem(): void {
    this.saving = true;
    this.error = "";

    const payload = this.toPayload();
    const request = this.editingId
      ? this.api.updateProblem(this.editingId, payload)
      : this.api.createProblem(payload);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.resetForm();
        this.loadProblems();
      },
      error: (error) => {
        this.error = error?.error?.msg || "تعذر حفظ المسألة.";
      },
    });
  }

  toggleActive(problem: AdminProblem): void {
    this.api.updateProblem(problem._id, { ...problem, active: !problem.active }).subscribe({
      next: () => this.loadProblems(),
      error: (error) => {
        this.error = error?.error?.msg || "تعذر تحديث المسألة.";
      },
    });
  }

  deleteProblem(problem: AdminProblem): void {
    if (!window.confirm(`حذف "${problem.title}"؟`)) return;

    this.api.deleteProblem(problem._id).subscribe({
      next: () => {
        if (this.editingId === problem._id) this.resetForm();
        this.loadProblems();
      },
      error: (error) => {
        this.error = error?.error?.msg || "تعذر حذف المسألة.";
      },
    });
  }

  loadProblems(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getProblems({
        page: this.page,
        limit: this.pageSize,
        search: this.searchTerm.trim(),
        difficulty: this.difficultyFilter,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.problems = response.problems || [];
          this.page = response.page;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          this.error = error?.error?.msg || "تعذر تحميل قائمة المسائل.";
        },
      });
  }

  resetForm(): void {
    this.editingId = "";
    this.idTouched = false;
    this.form = emptyForm();
  }

  syncId(): void {
    if (this.editingId || this.idTouched) return;
    this.form.id = this.slugify(this.form.title);
  }

  difficultyBadgeClass(difficulty: string): string {
    if (difficulty === "Hard") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    if (difficulty === "Medium") return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  difficultyLabel(difficulty: string): string {
    if (difficulty === "Hard") return "صعب";
    if (difficulty === "Medium") return "متوسط";
    return "سهل";
  }

  private toPayload(): Partial<AdminProblem> {
    return {
      id: this.slugify(this.form.id || this.form.title),
      title: this.form.title.trim(),
      difficulty: this.form.difficulty,
      category: this.form.category.trim() || "General",
      description: {
        text: this.form.descriptionText.trim(),
        notes: this.toLines(this.form.notesText),
      },
      examples: this.toExamples(this.form.examplesText),
      constraints: this.toLines(this.form.constraintsText),
      starterCode: {
        javascript: this.form.javascriptStarter,
        python: this.form.pythonStarter,
        java: this.form.javaStarter,
      },
      expectedOutput: {
        javascript: this.form.javascriptExpected,
        python: this.form.pythonExpected,
        java: this.form.javaExpected,
      },
      active: this.form.active,
    };
  }

  private toLines(value: string): string[] {
    return String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  private toExamples(value: string): AdminProblemExample[] {
    return this.toLines(value).map((line) => {
      const [input = "", output = "", explanation = ""] = line.split("|").map((part) => part.trim());
      return { input, output, explanation };
    });
  }

  private slugify(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
