import { httpsCallable } from "firebase/functions";
import { firebaseAuth, firebaseFunctions, isFirebaseConfigured } from "@/services/firebase/config";

export async function callFunction<TData, TResult>(
  name: string,
  data: TData,
): Promise<TResult> {
  if (!isFirebaseConfigured || !firebaseFunctions) {
    throw new Error("Firebase Functions is not configured.");
  }
  if (!firebaseAuth?.currentUser) {
    throw new Error(
      "A real Firebase Auth session is required before calling secure backend functions.",
    );
  }
  const callable = httpsCallable<TData, TResult>(firebaseFunctions, name);
  const result = await callable(data);
  return result.data;
}
