import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { from, switchMap } from "rxjs";

import { ClerkAuthService } from "../services/clerk.service";

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const clerkAuth = inject(ClerkAuthService);

  return from(clerkAuth.getSessionToken()).pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        : req.clone({ withCredentials: true });

      return next(authReq);
    }),
  );
};
