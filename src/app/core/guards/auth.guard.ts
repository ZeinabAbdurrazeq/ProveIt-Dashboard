import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { ClerkAuthService } from "../services/clerk.service";
import { environment } from "../../../environments/environment";

export const authGuard: CanActivateFn = async () => {
  const clerkAuth = inject(ClerkAuthService);
  const router = inject(Router);
  const adminEmail = environment.adminEmail.trim().toLowerCase();
  const email = (await clerkAuth.getCurrentEmail())?.trim().toLowerCase() || "";

  if (email === adminEmail) {
    return true;
  }

  return router.createUrlTree(["/login"]);
};
