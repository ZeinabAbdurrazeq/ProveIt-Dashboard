import { Injectable } from "@angular/core";
import { AdminLoginResponse } from "../models/admin.models";

const STORAGE_KEY = "provelt_admin_verified";
const ADMIN_EMAIL_KEY = "provelt_admin_email";

@Injectable({ providedIn: "root" })
export class AdminAuthService {
  getEmail(): string | null {
    return localStorage.getItem(ADMIN_EMAIL_KEY);
  }

  setSession(response: AdminLoginResponse): void {
    localStorage.setItem(STORAGE_KEY, "1");
    localStorage.setItem(ADMIN_EMAIL_KEY, response.admin.email);
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
  }

  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }
}


