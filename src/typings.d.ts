declare module "@clerk/clerk-js" {
  export class Clerk {
    constructor(publishableKey: string);
    load(): Promise<void>;
    mountSignIn(element: HTMLElement, options?: Record<string, unknown>): void;
    signOut(): Promise<void>;
    user?: {
      primaryEmailAddress?: { emailAddress?: string | null } | null;
      emailAddresses?: Array<{ emailAddress?: string | null }>;
    } | null;
  }
}
