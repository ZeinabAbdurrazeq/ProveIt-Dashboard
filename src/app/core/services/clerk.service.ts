import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Clerk } from "@clerk/clerk-js";

@Injectable({ providedIn: "root" })
export class ClerkAuthService {
  private clerk: Clerk | null = null;

  private async getClerk(): Promise<Clerk> {
    if (!this.clerk) {
      // 'domain' goes into the constructor options
      // @ts-ignore - Bypass strict TypeScript checks for satellite options
      this.clerk = new Clerk(environment.clerkPublishableKey, {
        domain: "proveit-dashboard-z3o7w.sevalla.app" // The admin dashboard URL
      });
      // 'isSatellite' and 'signInUrl' go into the load options
      // @ts-ignore - Bypass strict TypeScript checks for satellite options
      await this.clerk.load({
        isSatellite: true,
        signInUrl: "https://prove-it-b9lnm.sevalla.app/" // The main app URL
      });
    }

    return this.clerk;
  }

  

  async mountSignIn(element: HTMLDivElement): Promise<void> {
    const clerk = await this.getClerk();
    clerk.mountSignIn(element);
  }

  async getCurrentEmail(): Promise<string | null> {
    const clerk = await this.getClerk();
    return (
      clerk.user?.primaryEmailAddress?.emailAddress ||
      clerk.user?.emailAddresses?.[0]?.emailAddress ||
      null
    );
  }

  async getSessionToken(): Promise<string | null> {
    const clerk = await this.getClerk();
    const session = (clerk as any).session as {
      getToken?: () => Promise<string | null>;
    } | null | undefined;

    if (!session?.getToken) {
      return null;
    }

    return session.getToken();
  }

  async signOut(): Promise<void> {
    const clerk = await this.getClerk();
    await clerk.signOut();
  }

  async hasSignedInUser(): Promise<boolean> {
    const clerk = await this.getClerk();
    return Boolean(clerk.user);
  }
}
