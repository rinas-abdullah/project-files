import "server-only";
import { PendingAccount, createAccountDirectly } from "./users";
import { startEmailVerification } from "./verification";
import { createSessionToken } from "./session";
import { SessionUser } from "./session";

export type SignupResult =
  | { success: true; requiresVerification: true; email: string }
  | { success: true; requiresVerification: false; user: SessionUser; token: string }
  | { success: false; error: string; status: number };

// Shared by doctor registration and patient activation: email sign-ups must
// verify a real code before the account exists; phone-only sign-ups are
// created immediately since there's no free way to send a real SMS code yet.
export async function completeSignup(data: PendingAccount): Promise<SignupResult> {
  if (data.email) {
    const { email, ...payload } = data;
    const started = await startEmailVerification(email, payload);
    if (!started.success) {
      return { success: false, error: started.error, status: 502 };
    }
    return { success: true, requiresVerification: true, email };
  }

  const user = await createAccountDirectly(data);
  const token = await createSessionToken(user);
  return { success: true, requiresVerification: false, user, token };
}
