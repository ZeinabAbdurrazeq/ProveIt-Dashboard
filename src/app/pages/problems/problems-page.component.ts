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
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Problem bank</p>
            <h2 class="mt-2 text-2xl font-bold text-white">Problems</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">Create, update, archive, and delete coding problem records for the platform problem bank.</p>
          </div>
          <div class="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
            <input class="admin-input" type="text" placeholder="Search title, id, or category" [(ngModel)]="searchTerm" (keydown.enter)="search()" />
            <select class="admin-input sm:max-w-44" [(ngModel)]="difficultyFilter" (change)="search()">
              <option value="">All levels</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <button class="admin-button-secondary" type="button" (click)="search()">Search</button>
            <button class="admin-button" type="button" (click)="startCreate()">New problem</button>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-5 text-red-100">
        {{ error }}
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)]">
        <div class="space-y-6">
          <div class="admin-panel overflow-hidden p-0">
            <div *ngIf="loading" class="p-8 text-base-content/70">Loading problems...</div>

            <div *ngIf="!loading && problems.length === 0" class="p-10 text-center text-base-content/60">
              <p class="text-lg font-semibold text-white">No problems found</p>
              <p class="mt-2 text-sm">Create the first problem from the editor.</p>
            </div>

            <div *ngIf="!loading && problems.length" class="divide-y divide-white/10">
              <article *ngFor="let problem of problems" class="p-5">
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="admin-chip">{{ problem.category || 'General' }}</span>
                      <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]" [ngClass]="difficultyBadgeClass(problem.difficulty)">
                        {{ problem.difficulty }}
                      </span>
                      <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]" [ngClass]="problem.active ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-400/20 bg-slate-400/10 text-slate-300'">
                        {{ problem.active ? 'Active' : 'Archived' }}
                      </span>
                    </div>
                    <h3 class="mt-3 break-words text-xl font-bold text-white">{{ problem.title }}</h3>
                    <p class="mt-2 break-words text-sm text-base-content/65">{{ problem.description.text || 'No description yet.' }}</p>
                    <p class="mt-2 font-mono text-xs text-base-content/45">/{{ problem.id }}</p>
                  </div>
                  <div class="flex shrink-0 flex-wrap gap-2">
                    <button class="admin-button-secondary" type="button" (click)="startEdit(problem)">Edit</button>
                    <button class="admin-button-secondary" type="button" (click)="toggleActive(problem)">
                      {{ problem.active ? 'Archive' : 'Activate' }}
                    </button>
                    <button class="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100" type="button" (click)="deleteProblem(problem)">Delete</button>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-base-content/60">Page {{ page }} of {{ totalPages }}</p>
            <div class="flex gap-2">
              <button class="admin-button-secondary" type="button" [disabled]="page <= 1 || loading" (click)="goToPage(page - 1)">Previous</button>
              <button class="admin-button-secondary" type="button" [disabled]="page >= totalPages || loading" (click)="goToPage(page + 1)">Next</button>
            </div>
          </section>
        </div>

        <form class="admin-panel problem-editor-panel space-y-5 p-5" (ngSubmit)="saveProblem()">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/70">{{ editingId ? 'Edit problem' : 'Create problem' }}</p>
            <h3 class="mt-2 text-xl font-bold text-white">{{ form.title || 'Untitled problem' }}</h3>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="problem-field-label">Title</span>
              <input class="admin-input" required [(ngModel)]="form.title" name="title" (ngModelChange)="syncId()" />
            </label>
            <label class="space-y-2">
              <span class="problem-field-label">Problem ID</span>
              <input class="admin-input font-mono" required [(ngModel)]="form.id" name="problemId" (ngModelChange)="idTouched = true" />
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="problem-field-label">Difficulty</span>
              <select class="admin-input" [(ngModel)]="form.difficulty" name="difficulty">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
            <label class="space-y-2">
              <span class="problem-field-label">Category</span>
              <input class="admin-input" [(ngModel)]="form.category" name="category" />
            </label>
          </div>

          <label class="block space-y-2">
            <span class="problem-field-label">Description</span>
            <textarea class="admin-input min-h-28" required [(ngModel)]="form.descriptionText" name="descriptionText"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="problem-field-label">Notes</span>
            <textarea class="admin-input min-h-20" placeholder="One note per line" [(ngModel)]="form.notesText" name="notesText"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="problem-field-label">Examples</span>
            <textarea class="admin-input min-h-24" placeholder="input | output | explanation" [(ngModel)]="form.examplesText" name="examplesText"></textarea>
          </label>

          <label class="block space-y-2">
            <span class="problem-field-label">Constraints</span>
            <textarea class="admin-input min-h-20" placeholder="One constraint per line" [(ngModel)]="form.constraintsText" name="constraintsText"></textarea>
          </label>

          <div class="space-y-3">
            <h4 class="font-bold text-white">Starter code</h4>
            <textarea class="admin-input min-h-32 font-mono text-xs" placeholder="JavaScript starter" [(ngModel)]="form.javascriptStarter" name="javascriptStarter"></textarea>
            <textarea class="admin-input min-h-32 font-mono text-xs" placeholder="Python starter" [(ngModel)]="form.pythonStarter" name="pythonStarter"></textarea>
            <textarea class="admin-input min-h-32 font-mono text-xs" placeholder="Java starter" [(ngModel)]="form.javaStarter" name="javaStarter"></textarea>
          </div>

          <div class="space-y-3">
            <h4 class="font-bold text-white">Expected output</h4>
            <textarea class="admin-input min-h-20 font-mono text-xs" placeholder="JavaScript expected output" [(ngModel)]="form.javascriptExpected" name="javascriptExpected"></textarea>
            <textarea class="admin-input min-h-20 font-mono text-xs" placeholder="Python expected output" [(ngModel)]="form.pythonExpected" name="pythonExpected"></textarea>
            <textarea class="admin-input min-h-20 font-mono text-xs" placeholder="Java expected output" [(ngModel)]="form.javaExpected" name="javaExpected"></textarea>
          </div>

          <label class="flex items-center gap-3">
            <input type="checkbox" class="toggle toggle-success" [(ngModel)]="form.active" name="active" />
            <span class="font-semibold text-base-content/80">Active</span>
          </label>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button class="admin-button-secondary" type="button" (click)="resetForm()">Reset</button>
            <button class="admin-button" type="submit" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save problem' }}
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
        this.error = error?.error?.msg || "Could not save problem.";
      },
    });
  }

  toggleActive(problem: AdminProblem): void {
    this.api.updateProblem(problem._id, { ...problem, active: !problem.active }).subscribe({
      next: () => this.loadProblems(),
      error: (error) => {
        this.error = error?.error?.msg || "Could not update problem.";
      },
    });
  }

  deleteProblem(problem: AdminProblem): void {
    if (!window.confirm(`Delete "${problem.title}"?`)) return;

    this.api.deleteProblem(problem._id).subscribe({
      next: () => {
        if (this.editingId === problem._id) this.resetForm();
        this.loadProblems();
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not delete problem.";
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
          this.error = error?.error?.msg || "The problems list could not be loaded.";
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
