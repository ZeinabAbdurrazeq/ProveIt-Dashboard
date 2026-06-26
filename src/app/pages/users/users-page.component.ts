import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminApiService } from "../../core/services/admin-api.service";
import { AdminUser } from "../../core/models/admin.models";

@Component({
  selector: "app-users-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <section class="admin-panel p-5">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Management</p>
            <h2 class="mt-2 text-2xl font-bold text-white">Users</h2>
            <p class="mt-2 text-sm text-base-content/60">Search by name or email, then update the role with confirmation.</p>
          </div>
          <div class="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <input
              class="admin-input"
              type="text"
              placeholder="Search users by name or email"
              [(ngModel)]="searchTerm"
              (keydown.enter)="search()"
            />
            <button class="admin-button-secondary" type="button" (click)="search()">Search</button>
          </div>
        </div>
      </section>

      <section *ngIf="loading" class="admin-panel p-5">
        <div class="space-y-3">
          <div *ngFor="let _ of skeletonRows" class="grid grid-cols-5 gap-4 rounded-3xl border border-base-300 bg-white/5 p-4">
            <div class="h-12 w-12 animate-pulse rounded-2xl bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-4 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-6 w-24 animate-pulse rounded-full bg-white/10"></div>
            <div class="h-10 w-24 animate-pulse rounded-2xl bg-white/10"></div>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100">
        <p class="text-lg font-semibold">Couldn’t load users.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
        <button class="admin-button mt-4" type="button" (click)="search()">Retry</button>
      </section>

      <section *ngIf="!loading && !error" class="admin-panel overflow-hidden p-0">
        <div *ngIf="users.length; else emptyUsers" class="overflow-x-auto">
          <table class="admin-table">
            <thead class="bg-white/5">
              <tr>
                <th class="admin-th">Profile</th>
                <th class="admin-th">Name</th>
                <th class="admin-th">Email</th>
                <th class="admin-th">Role</th>
                <th class="admin-th">Joined</th>
                <th class="admin-th">Change role</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10 bg-base-100">
              <tr *ngFor="let user of users">
                <td class="admin-td">
                  <img
                    [src]="user.profileImage || defaultAvatar"
                    [alt]="user.name"
                    class="h-12 w-12 rounded-2xl border border-base-300 object-cover"
                  />
                </td>
                <td class="admin-td">
                  <p class="font-semibold text-white">{{ user.name }}</p>
                  <p class="text-xs text-base-content/60">{{ user.clerkId }}</p>
                </td>
                <td class="admin-td text-base-content/80">{{ user.email }}</td>
                <td class="admin-td">
                  <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="roleBadgeClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td class="admin-td text-base-content/80">{{ formatDate(user.createdAt) }}</td>
                <td class="admin-td">
                  <select
                    class="admin-input !w-40 !rounded-xl !py-2"
                    [value]="user.role"
                    (change)="promptRoleChange(user, $any($event.target).value)"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #emptyUsers>
          <div class="p-12 text-center text-base-content/60">
            <p class="text-lg font-semibold text-white">No users found</p>
            <p class="mt-2 text-sm">Try a different search term or remove filters.</p>
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

      <div *ngIf="confirmOpen" class="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm">
        <div class="admin-panel w-full max-w-md p-6">
          <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">Confirm role change</p>
          <h3 class="mt-2 text-2xl font-bold text-white">Update {{ pendingUser?.name }}</h3>
          <p class="mt-3 text-sm leading-6 text-base-content/80">
            Change this account role from <span class="font-semibold text-white">{{ pendingUser?.role }}</span>
            to <span class="font-semibold text-white">{{ pendingRole }}</span>?
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button class="admin-button-secondary" type="button" (click)="closeConfirm()">Cancel</button>
            <button class="admin-button" type="button" (click)="confirmRoleChange()" [disabled]="savingRole">
              {{ savingRole ? 'Saving...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  savingRole = false;
  error = "";
  page = 1;
  totalPages = 1;
  pageSize = 10;
  searchTerm = "";
  users: AdminUser[] = [];
  confirmOpen = false;
  pendingUser: AdminUser | null = null;
  pendingRole: "user" | "admin" = "user";
  defaultAvatar = "https://ui-avatars.com/api/?name=Provelt&background=0f172a&color=ffffff";
  skeletonRows = Array.from({ length: 5 });

  ngOnInit(): void {
    this.loadUsers();
  }

  search(): void {
    this.page = 1;
    this.loadUsers();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.page = page;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getUsers({ page: this.page, limit: this.pageSize, search: this.searchTerm.trim() })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          this.users = response.users || [];
          this.page = response.page;
          this.totalPages = response.totalPages;
        },
        error: (error) => {
          this.error = error?.error?.msg || "The users table could not be loaded.";
        },
      });
  }

  promptRoleChange(user: AdminUser, nextRole: string): void {
    if (nextRole === user.role) {
      return;
    }

    this.pendingUser = user;
    this.pendingRole = nextRole === "admin" ? "admin" : "user";
    this.confirmOpen = true;
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.pendingUser = null;
  }

  confirmRoleChange(): void {
    if (!this.pendingUser) {
      return;
    }

    this.savingRole = true;
    this.api
      .updateUserRole(this.pendingUser._id, this.pendingRole)
      .pipe(
        finalize(() => {
          this.savingRole = false;
        }),
      )
      .subscribe({
        next: () => {
          this.confirmOpen = false;
          this.pendingUser = null;
          this.loadUsers();
        },
        error: (error) => {
          this.error = error?.error?.msg || "Could not update the role.";
          this.confirmOpen = false;
        },
      });
  }

  roleBadgeClass(role: string): string {
    return role === "admin"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  }
}


