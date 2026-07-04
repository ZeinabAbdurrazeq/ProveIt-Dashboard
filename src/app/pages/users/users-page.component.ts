import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { finalize } from "rxjs";

import { AdminRole, AdminUser } from "../../core/models/admin.models";
import { AdminApiService } from "../../core/services/admin-api.service";

type UserForm = {
  name: string;
  email: string;
  clerkId: string;
  profileImage: string;
  role: AdminRole;
  score: number;
  level: string;
};

const emptyForm = (): UserForm => ({
  name: "",
  email: "",
  clerkId: "",
  profileImage: "",
  role: "user",
  score: 0,
  level: "Entry-Level",
});

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
            <p class="mt-2 text-sm text-base-content/60">Manage user records and update permissions without crowded menus.</p>
          </div>
          <div class="grid w-full gap-3 sm:grid-cols-[1fr_auto_auto] lg:max-w-xl">
            <input class="admin-input" type="text" placeholder="Search name or email" [(ngModel)]="searchTerm" (keydown.enter)="search()" />
            <button class="admin-button-secondary" type="button" (click)="search()">Search</button>
            <button class="admin-button" type="button" (click)="startCreate()">New user</button>
          </div>
        </div>
      </section>

      <section *ngIf="error" class="admin-panel border-red-500/20 bg-red-500/10 p-6 text-red-100">
        <p class="text-lg font-semibold">The action could not be completed.</p>
        <p class="mt-2 text-sm text-red-200/80">{{ error }}</p>
      </section>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]">
        <div class="space-y-6">
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

          <section *ngIf="!loading" class="admin-panel overflow-hidden p-0">
            <div *ngIf="users.length; else emptyUsers" class="overflow-x-auto">
              <table class="admin-table min-w-[860px]">
                <thead class="bg-white/5">
                  <tr>
                    <th class="admin-th">Profile</th>
                    <th class="admin-th">Email</th>
                    <th class="admin-th">Role</th>
                    <th class="admin-th">Score</th>
                    <th class="admin-th">Joined</th>
                    <th class="admin-th">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/10 bg-base-100">
                  <tr *ngFor="let user of users">
                    <td class="admin-td">
                      <div class="flex items-center gap-3">
                        <img [src]="user.profileImage || defaultAvatar" [alt]="user.name" class="h-12 w-12 rounded-2xl border border-base-300 object-cover" />
                        <div>
                          <p class="font-semibold text-white">{{ user.name }}</p>
                          <p class="text-xs text-base-content/60">{{ user.clerkId }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="admin-td text-base-content/80">{{ user.email }}</td>
                    <td class="admin-td">
                      <span class="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" [ngClass]="roleBadgeClass(user.role)">
                        {{ user.role === 'admin' ? 'Admin' : 'User' }}
                      </span>
                    </td>
                    <td class="admin-td text-base-content/80">
                      <p class="font-semibold text-white">{{ user.score || 0 }}</p>
                      <p class="text-xs text-base-content/60">{{ user.level || 'Entry-Level' }}</p>
                    </td>
                    <td class="admin-td text-base-content/80">{{ formatDate(user.createdAt) }}</td>
                    <td class="admin-td">
                      <div class="flex flex-wrap gap-2">
                        <button class="admin-button-secondary !px-3 !py-2" type="button" (click)="startEdit(user)">Edit</button>
                        <button class="admin-button-secondary !px-3 !py-2" type="button" (click)="toggleRole(user)">
                          {{ user.role === 'admin' ? 'Make user' : 'Make admin' }}
                        </button>
                        <button class="rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100" type="button" (click)="deleteUser(user)">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #emptyUsers>
              <div class="p-12 text-center text-base-content/60">
                <p class="text-lg font-semibold text-white">No users found</p>
                <p class="mt-2 text-sm">Try another search or create a new user record.</p>
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

        <form class="admin-panel space-y-5 p-5" (ngSubmit)="saveUser()">
          <div>
            <p class="text-sm uppercase tracking-[0.24em] text-base-content/60">{{ editingId ? 'Edit user' : 'Create user' }}</p>
            <h3 class="mt-2 text-xl font-bold text-white">{{ form.name || 'User record' }}</h3>
            <p class="mt-2 text-xs leading-5 text-base-content/60">This edits the database record only and does not create a new Clerk account.</p>
          </div>

          <label class="block space-y-2">
            <span class="text-sm font-semibold text-base-content/75">Name</span>
            <input class="admin-input" required [(ngModel)]="form.name" name="name" />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-semibold text-base-content/75">Email</span>
            <input class="admin-input" required type="email" [(ngModel)]="form.email" name="email" />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-semibold text-base-content/75">Clerk ID</span>
            <input class="admin-input" [required]="!!editingId" placeholder="Generated automatically for local users" [(ngModel)]="form.clerkId" name="clerkId" />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-semibold text-base-content/75">Image URL</span>
            <input class="admin-input" [(ngModel)]="form.profileImage" name="profileImage" />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-semibold text-base-content/75">Level</span>
              <select class="admin-input" [(ngModel)]="form.level" name="level">
                <option value="Entry-Level">Entry-Level</option>
                <option value="Junior">Junior</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>
            <label class="space-y-2">
              <span class="text-sm font-semibold text-base-content/75">Score</span>
              <input class="admin-input" type="number" min="0" [(ngModel)]="form.score" name="score" />
            </label>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button class="admin-button-secondary" type="button" (click)="resetForm()">Reset</button>
            <button class="admin-button" type="submit" [disabled]="saving">
              {{ saving ? 'Saving...' : editingId ? 'Save changes' : 'Create user' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = true;
  saving = false;
  error = "";
  page = 1;
  totalPages = 1;
  pageSize = 10;
  searchTerm = "";
  editingId = "";
  users: AdminUser[] = [];
  form: UserForm = emptyForm();
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
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadUsers();
  }

  startCreate(): void {
    this.resetForm();
  }

  startEdit(user: AdminUser): void {
    this.editingId = user._id;
    this.form = {
      name: user.name || "",
      email: user.email || "",
      clerkId: user.clerkId || "",
      profileImage: user.profileImage || "",
      role: user.role || "user",
      score: user.score || 0,
      level: user.level || "Entry-Level",
    };
  }

  saveUser(): void {
    this.saving = true;
    this.error = "";

    const request = this.editingId
      ? this.api.updateUser(this.editingId, this.form)
      : this.api.createUser(this.form);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.resetForm();
        this.loadUsers();
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not save user.";
      },
    });
  }

  toggleRole(user: AdminUser): void {
    const nextRole: AdminRole = user.role === "admin" ? "user" : "admin";
    this.api.updateUserRole(user._id, nextRole).subscribe({
      next: () => this.loadUsers(),
      error: (error) => {
        this.error = error?.error?.msg || "Could not change role.";
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!window.confirm(`Delete "${user.name}"? This will remove the local user record.`)) return;

    this.api.deleteUser(user._id).subscribe({
      next: () => {
        if (this.editingId === user._id) this.resetForm();
        this.loadUsers();
      },
      error: (error) => {
        this.error = error?.error?.msg || "Could not delete user.";
      },
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = "";

    this.api
      .getUsers({ page: this.page, limit: this.pageSize, search: this.searchTerm.trim() })
      .pipe(finalize(() => (this.loading = false)))
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

  resetForm(): void {
    this.editingId = "";
    this.form = emptyForm();
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
