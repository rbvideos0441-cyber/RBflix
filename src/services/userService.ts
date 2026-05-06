import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";

export interface UserData {
  uid: string;
  email: string;
  subscriptionPlan?: "basic" | "standard" | "premium";
  subscriptionStatus?: "active" | "canceled" | "incomplete";
  subscriptionExpiresAt?: any;
  createdAt?: any;
}

export const userService = {
  async syncUser(user: User): Promise<UserData | null> {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser: UserData = {
        uid: user.uid,
        email: user.email || "",
        subscriptionStatus: "incomplete",
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, newUser);
      return newUser;
    }

    return userSnap.data() as UserData;
  },

  async getUser(uid: string): Promise<UserData | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  },

  async updateSubscription(uid: string, plan: "basic" | "standard" | "premium", status: "active" | "incomplete", expiresAt?: Date | null) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      subscriptionPlan: plan,
      subscriptionStatus: status,
      subscriptionExpiresAt: expiresAt
    }, { merge: true });
  }
};
