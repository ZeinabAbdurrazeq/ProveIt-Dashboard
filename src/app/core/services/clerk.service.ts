import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Clerk } from "@clerk/clerk-js";

@Injectable({ providedIn: "root" })
export class ClerkAuthService {
  private clerk: Clerk | null = null;

  private async getClerk(): Promise<Clerk> {
    if (!this.clerk) {
      this.clerk = new Clerk(environment.clerkPublishableKey);
      await this.clerk.load();
    }

    return this.clerk;
  }

  async mountSignIn(element: HTMLElement): Promise<void> {
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
