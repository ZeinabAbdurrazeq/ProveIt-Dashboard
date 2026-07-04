import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminBlogPost, AdminBlogSection } from "../../core/models/admin.models";
import { AdminApiService } from "../../core/services/admin-api.service";

type BlogForm = Omit<AdminBlogPost, "_id" | "createdAt" | "updatedAt">;

const emptyText = () => ({ en: "", ar: "" });

const emptyForm = (): BlogForm => ({
  title: emptyText(),
  slug: "",
  excerpt: emptyText(),
  category: { en: "General", ar: "" },
  readTime: emptyText(),
  author: { en: "ProveIt Team", ar: "" },
  content: [{ heading: emptyText(), body: emptyText() }],
  published: false,
  publishedAt: null,
});

@Component({
  selector: "app-blog-posts-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Content</p>
            <h2 class="mt-2 text-2xl font-bold text-white">Blog posts</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">Create, edit, delete, and publish public blog articles in English and Arabic.</p>
          </div>
          <div class="flex w-full flex-col gap-3 sm:flex-row xl:max-w-xl">
            <input class="admin-input" type="text" placeholder="Search posts" [(ngModel)]="searchTerm" (keydown.enter)="loadPosts()" />
            <button class="admin-button-secondary" type="button" (click)="loadPosts()">Search</button>
            <button class="admin-button" type="button" (click)="startCreate()">New post</button>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-5 text-red-100">
        {{ error }}
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,520px)]">
        <div class="admin-panel overflow-hidden p-0">
          <div *ngIf="loading" class="p-8 text-base-content/70">Loading posts...</div>

          <div *ngIf="!loading && posts.length === 0" class="p-10 text-center text-base-content/60">
            <p class="text-lg font-semibold text-white">No posts yet</p>
            <p class="mt-2 text-sm">Create the first blog article from the form.</p>
          </div>

          <div *ngIf="!loading && posts.length" class="divide-y divide-white/10">
            <article *ngFor="let post of posts" class="p-5">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="admin-chip">{{ post.category.en || 'General' }}</span>
                    <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]" [ngClass]="post.published ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/20 bg-amber-400/10 text-amber-300'">
                      {{ post.published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                  <h3 class="mt-3 break-words text-xl font-bold text-white">{{ post.title.en }}</h3>
                  <p class="mt-2 break-words text-sm text-base-content/65">{{ post.excerpt.en }}</p>
                  <p class="mt-2 text-xs text-base-content/45">/{{ post.slug }}</p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                  <button class="admin-button-secondary" type="button" (click)="startEdit(post)">Edit</button>
                  <button class="admin-button-secondary" type="button" (click)="togglePublish(post)">
                    {{ post.published ? 'Unpublish' : 'Publish' }}
                  </button>
                  <button class="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100" type="button" (click)="deletePost(post)">Delete</button>
                </div>
              </div>
            </article>
          </div>
        </div>

        <form class="admin-panel blog-editor-panel space-y-5 p-5" (ngSubmit)="savePost()">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/70">{{ editingId ? 'Edit post' : 'Create post' }}</p>
            <h3 class="mt-2 text-xl font-bold text-white">{{ form.title.en || 'Untitled post' }}</h3>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="blog-field-label">Title EN</span>
              <input class="admin-input" required [(ngModel)]="form.title.en" name="titleEn" (ngModelChange)="syncSlug()" />
            </label>
            <label class="space-y-2">
              <span class="blog-field-label">Title AR</span>
              <input class="admin-input" [(ngModel)]="form.title.ar" name="titleAr" dir="rtl" />
            </label>
          </div>

          <label class="space-y-2 block">
            <span class="blog-field-label">Slug</span>
            <input class="admin-input" required [(ngModel)]="form.slug" name="slug" />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="blog-field-label">Category EN</span>
              <input class="admin-input" [(ngModel)]="form.category.en" name="categoryEn" />
            </label>
            <label class="space-y-2">
              <span class="blog-field-label">Category AR</span>
              <input class="admin-input" [(ngModel)]="form.category.ar" name="categoryAr" dir="rtl" />
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="blog-field-label">Read time EN</span>
              <input class="admin-input" [(ngModel)]="form.readTime.en" name="readTimeEn" />
            </label>
            <label class="space-y-2">
              <span class="blog-field-label">Author EN</span>
              <input class="admin-input" [(ngModel)]="form.author.en" name="authorEn" />
            </label>
          </div>

          <label class="space-y-2 block">
            <span class="blog-field-label">Excerpt EN</span>
            <textarea class="admin-input min-h-24" [(ngModel)]="form.excerpt.en" name="excerptEn"></textarea>
          </label>
          <label class="space-y-2 block">
            <span class="blog-field-label">Excerpt AR</span>
            <textarea class="admin-input min-h-24" [(ngModel)]="form.excerpt.ar" name="excerptAr" dir="rtl"></textarea>
          </label>

          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <h4 class="font-bold text-white">Content sections</h4>
              <button class="admin-button-secondary" type="button" (click)="addSection()">Add section</button>
            </div>
            <div *ngFor="let section of form.content; let i = index" class="blog-section-card rounded-3xl p-4">
              <div class="mb-3 flex justify-between gap-3">
                <span class="blog-field-label">Section {{ i + 1 }}</span>
                <button class="text-sm font-semibold text-red-200" type="button" (click)="removeSection(i)" [disabled]="form.content.length === 1">Remove</button>
              </div>
              <div class="grid gap-3">
                <input class="admin-input" placeholder="Heading EN" [(ngModel)]="section.heading.en" [name]="'headingEn' + i" />
                <input class="admin-input" placeholder="Heading AR" [(ngModel)]="section.heading.ar" [name]="'headingAr' + i" dir="rtl" />
                <textarea class="admin-input min-h-28" placeholder="Body EN" [(ngModel)]="section.body.en" [name]="'bodyEn' + i"></textarea>
                <textarea class="admin-input min-h-28" placeholder="Body AR" [(ngModel)]="section.body.ar" [name]="'bodyAr' + i" dir="rtl"></textarea>
              </div>
            </div>
          </div>

          <label class="flex items-center gap-3">
            <input type="checkbox" class="toggle toggle-success" [(ngModel)]="form.published" name="published" />
            <span class="font-semibold text-base-content/80">Published</span>
          </label>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button class="admin-button-secondary" type="button" (click)="resetForm()">Reset</button>
            <button class="admin-button" type="submit" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save post' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .blog-editor-panel {
      background: linear-gradient(180deg, hsl(var(--b1)) 0%, hsl(var(--b2) / 0.72) 100%);
    }

    .blog-editor-panel .admin-input {
      border-color: hsl(var(--bc) / 0.18);
      background: hsl(var(--b2));
      color: hsl(var(--bc));
      box-shadow: inset 0 1px 0 hsl(var(--bc) / 0.04);
    }

    .blog-editor-panel textarea.admin-input {
      background: hsl(var(--b2) / 0.88);
      line-height: 1.65;
    }

    .blog-editor-panel .admin-input:hover {
      border-color: hsl(var(--bc) / 0.28);
      background: hsl(var(--b2) / 0.94);
    }

    .blog-editor-panel .admin-input:focus {
      border-color: hsl(var(--p));
      background: hsl(var(--b1));
      box-shadow: 0 0 0 3px hsl(var(--p) / 0.2), inset 0 1px 0 hsl(var(--bc) / 0.05);
    }

    .blog-editor-panel .admin-input::placeholder {
      color: hsl(var(--bc) / 0.62);
    }

    .blog-field-label {
      display: inline-flex;
      color: hsl(var(--bc) / 0.86);
      font-size: 0.875rem;
      font-weight: 700;
    }

    .blog-section-card {
      border: 1px solid hsl(var(--bc) / 0.14);
      background: hsl(var(--b1) / 0.72);
      box-shadow: inset 0 1px 0 hsl(var(--bc) / 0.04);
    }
  `],
})
export class BlogPostsPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  posts: AdminBlogPost[] = [];
  loading = true;
  saving = false;
  error = "";
  searchTerm = "";
  editingId = "";
  slugTouched = false;
  form: BlogForm = emptyForm();

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.error = "";
    this.api
      .getBlogPosts(this.searchTerm.trim())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.posts = response.posts || [];
        },
        error: (error) => {
          this.error = error?.error?.msg || "Could not load blog posts.";
        },
      });
  }

  startCreate(): void {
    this.resetForm();
  }

  startEdit(post: AdminBlogPost): void {
    this.editingId = post._id;
    this.slugTouched = true;
    this.form = JSON.parse(JSON.stringify({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      readTime: post.readTime,
      author: post.author,
      content: post.content?.length ? post.content : [{ heading: emptyText(), body: emptyText() }],
      published: post.published,
      publishedAt: post.publishedAt || null,
    }));
  }

  savePost(): void {
    this.saving = true;
    const request = this.editingId
      ? this.api.updateBlogPost(this.editingId, this.form)
      : this.api.createBlogPost(this.form);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.resetForm();
        this.loadPosts();
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not save blog post.";
      },
    });
  }

  togglePublish(post: AdminBlogPost): void {
    const next = { ...post, published: !post.published };
    this.api.updateBlogPost(post._id, next).subscribe({
      next: () => this.loadPosts(),
      error: (error) => {
        this.error = error?.error?.msg || "Could not update publish state.";
      },
    });
  }

  deletePost(post: AdminBlogPost): void {
    if (!window.confirm(`Delete "${post.title.en}"?`)) return;

    this.api.deleteBlogPost(post._id).subscribe({
      next: () => this.loadPosts(),
      error: (error) => {
        this.error = error?.error?.msg || "Could not delete blog post.";
      },
    });
  }

  addSection(): void {
    this.form.content.push({ heading: emptyText(), body: emptyText() });
  }

  removeSection(index: number): void {
    if (this.form.content.length === 1) return;
    this.form.content.splice(index, 1);
  }

  resetForm(): void {
    this.editingId = "";
    this.slugTouched = false;
    this.form = emptyForm();
  }

  syncSlug(): void {
    if (this.editingId || this.slugTouched) return;
    this.form.slug = this.slugify(this.form.title.en);
  }

  private slugify(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
