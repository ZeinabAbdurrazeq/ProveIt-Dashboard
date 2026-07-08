import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";

import {
  CommunityPost,
  CommunityPostStatus,
} from "../../core/models/admin.models";
import { AdminApiService } from "../../core/services/admin-api.service";

@Component({
  selector: "app-community-moderation-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="admin-chip w-fit">Posts Review</p>
            <h2 class="mt-3 text-2xl font-extrabold">Review community posts</h2>
            <p class="mt-2 max-w-2xl text-sm text-base-content/60">
              Approve helpful posts for the public feed or reject posts that need to stay hidden.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let option of statusOptions"
              type="button"
              class="admin-button-secondary"
              [class.admin-button]="selectedStatus === option"
              (click)="setStatus(option)"
            >
              {{ option | titlecase }}
            </button>
          </div>
        </div>
      </section>

      <section *ngIf="loading" class="grid gap-4 xl:grid-cols-2">
        <article *ngFor="let _ of skeletons" class="admin-panel p-5">
          <div class="h-4 w-32 animate-pulse rounded-full bg-base-300"></div>
          <div class="mt-5 h-24 animate-pulse rounded-3xl bg-base-200"></div>
        </article>
      </section>

      <section *ngIf="error" class="admin-panel border-error/30 bg-error/10 p-5">
        <p class="font-semibold text-error">{{ error }}</p>
        <button type="button" class="admin-button mt-4" (click)="loadPosts()">Retry</button>
      </section>

      <section *ngIf="!loading && !error && posts.length === 0" class="admin-panel p-8 text-center">
        <p class="text-lg font-bold">No {{ selectedStatus }} community posts.</p>
        <p class="mt-2 text-sm text-base-content/60">The queue is clear for this status.</p>
      </section>

      <section *ngIf="!loading && !error && posts.length > 0" class="grid gap-5 xl:grid-cols-2">
        <article *ngFor="let post of posts" class="admin-panel overflow-hidden p-0">
          <div class="p-5">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex min-w-0 items-center gap-3">
                <img
                  *ngIf="post.author?.profileImage; else initials"
                  [src]="post.author?.profileImage"
                  [alt]="post.author?.name || 'Author'"
                  class="h-12 w-12 shrink-0 rounded-2xl border border-base-300 object-cover"
                />
                <ng-template #initials>
                  <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
                    {{ getInitials(post.author?.name) }}
                  </div>
                </ng-template>

                <div class="min-w-0">
                  <h3 class="truncate font-extrabold">{{ post.author?.name || "Unknown author" }}</h3>
                  <p class="mt-1 text-xs text-base-content/55">
                    {{ post.author?.level || "No level" }} · {{ post.createdAt | date: "mediumDate" }}
                  </p>
                </div>
              </div>

              <span class="admin-chip capitalize">{{ post.status }}</span>
            </div>

            <div class="mt-5 rounded-3xl border border-base-300 bg-base-200/40 p-4">
              <h4 *ngIf="post.title" class="mb-2 text-lg font-extrabold">{{ post.title }}</h4>
              <p class="whitespace-pre-wrap break-words text-sm leading-6 text-base-content/75">
                {{ post.content }}
              </p>
            </div>

            <img
              *ngIf="post.imageUrl"
              [src]="post.imageUrl"
              [alt]="post.title || 'Community post image'"
              class="mt-4 max-h-64 w-full rounded-3xl border border-base-300 object-cover"
            />

            <div class="mt-4 flex flex-wrap gap-3 text-xs text-base-content/60">
              <span>👍 {{ post.reactionCounts.like || 0 }}</span>
              <span>🤝 {{ post.reactionCounts.support || 0 }}</span>
              <span>❤️ {{ post.reactionCounts.love || 0 }}</span>
              <span>🎉 {{ post.reactionCounts.celebrate || 0 }}</span>
              <span>😄 {{ post.reactionCounts.haha || 0 }}</span>
              <span>😠 {{ post.reactionCounts.angry || 0 }}</span>
            </div>

            <div *ngIf="post.rejectionReason" class="mt-4 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error">
              {{ post.rejectionReason }}
            </div>
          </div>

          <div class="border-t border-base-300 p-5">
            <details class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <summary class="cursor-pointer text-sm font-bold">Moderation history</summary>
              <div class="mt-3 space-y-2">
                <p
                  *ngFor="let item of post.moderationHistory || []"
                  class="rounded-2xl bg-base-200/50 p-3 text-xs text-base-content/65"
                >
                  <span class="font-bold capitalize">{{ item.action }}</span>
                  <span> · {{ item.createdAt | date: "medium" }}</span>
                  <span *ngIf="item.note"> · {{ item.note }}</span>
                </p>
                <p *ngIf="!post.moderationHistory?.length" class="text-xs text-base-content/50">
                  No moderation history yet.
                </p>
              </div>
            </details>

            <div *ngIf="post.status === 'pending'" class="mt-4 space-y-3">
              <label class="block">
                <span class="text-xs font-semibold uppercase text-base-content/50">Reject reason optional</span>
                <input
                  class="admin-input mt-2"
                  [(ngModel)]="rejectReasons[post._id]"
                  name="rejectReason-{{ post._id }}"
                  placeholder="Short reason shown to the author"
                />
              </label>

              <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="admin-button-secondary border-error/40 text-error"
                  (click)="rejectPost(post)"
                  [disabled]="actionId === post._id"
                >
                  Reject
                </button>
                <button
                  type="button"
                  class="admin-button"
                  (click)="approvePost(post)"
                  [disabled]="actionId === post._id"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  `,
})
export class CommunityModerationPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  statusOptions: CommunityPostStatus[] = ["pending", "approved", "rejected"];
  selectedStatus: CommunityPostStatus = "pending";
  posts: CommunityPost[] = [];
  loading = false;
  error = "";
  actionId = "";
  rejectReasons: Record<string, string> = {};
  skeletons = Array.from({ length: 4 });

  ngOnInit(): void {
    this.loadPosts();
  }

  setStatus(status: CommunityPostStatus): void {
    this.selectedStatus = status;
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.error = "";

    this.api.getCommunityPosts(this.selectedStatus).subscribe({
      next: (response) => {
        this.posts = response.posts;
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not load community posts.";
        this.loading = false;
      },
    });
  }

  approvePost(post: CommunityPost): void {
    this.actionId = post._id;
    this.api.approveCommunityPost(post._id).subscribe({
      next: () => {
        this.actionId = "";
        this.loadPosts();
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not approve post.";
        this.actionId = "";
      },
    });
  }

  rejectPost(post: CommunityPost): void {
    this.actionId = post._id;
    this.api.rejectCommunityPost(post._id, this.rejectReasons[post._id] || "").subscribe({
      next: () => {
        this.actionId = "";
        this.loadPosts();
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not reject post.";
        this.actionId = "";
      },
    });
  }

  getInitials(name = ""): string {
    return (
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "P"
    );
  }
}
