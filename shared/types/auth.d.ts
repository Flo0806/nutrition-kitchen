// What the sealed session cookie carries. The database stays the truth: see requireUser.
declare module "#auth-utils" {
  interface User {
    id: number;
    name: string;
    provider: "google" | "bluesky";
  }
}

export {};
