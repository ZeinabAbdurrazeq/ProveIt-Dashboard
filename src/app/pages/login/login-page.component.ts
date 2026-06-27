import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid min-h-screen place-items-center bg-base-300 px-6 text-base-content">
      <div class="card w-full max-w-xl border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body gap-5 p-8 sm:p-10">
          <p class="text-sm uppercase tracking-[0.3em] text-base-content/60">Admin access</p>
          <h1 class="text-3xl font-black sm:text-4xl">Please log in through the main app first</h1>
          <p class="max-w-md text-sm leading-6 text-base-content/70">
            The admin dashboard uses the same Clerk session as the main app. Sign in on the main site first, then come back here.
          </p>
          <div class="card-actions pt-2">
            <a class="btn btn-primary" href="https://prove-it-b9lnm.sevalla.app" target="_blank" rel="noreferrer">
              Go to main app
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginPageComponent {}
