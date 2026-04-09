export type PromptCategory =
  | "behavior"
  | "security"
  | "onboarding"
  | "debugging"
  | "refactoring";

export interface PromptTip {
  id: string;
  prompt: string;
  category: PromptCategory;
}

export interface AntiPattern {
  grep: string;
  clean: string;
}

export const CATEGORIES: {
  id: PromptCategory;
  label: string;
}[] = [
  { id: "behavior", label: "Behavior Tracing" },
  { id: "security", label: "Security & Compliance" },
  { id: "onboarding", label: "Onboarding" },
  { id: "debugging", label: "Debugging" },
  { id: "refactoring", label: "Refactoring" },
];

export const PROMPT_TIPS: PromptTip[] = [
  // Behavior Tracing
  {
    id: "b1",
    prompt:
      "What happens when checkout fails after payment succeeds?",
    category: "behavior",
  },
  {
    id: "b2",
    prompt: "What code path runs when a file upload is too large?",
    category: "behavior",
  },
  {
    id: "b3",
    prompt:
      "How does the system recover if the message queue goes down?",
    category: "behavior",
  },
  {
    id: "b4",
    prompt:
      "What happens when a database query times out in the API layer?",
    category: "behavior",
  },

  // Security & Compliance
  {
    id: "s1",
    prompt:
      "Which API endpoints are accessible without authentication?",
    category: "security",
  },
  {
    id: "s2",
    prompt: "Where is PII logged or sent to third parties?",
    category: "security",
  },
  {
    id: "s3",
    prompt:
      "Where do we store or transmit credentials outside of environment variables?",
    category: "security",
  },
  {
    id: "s4",
    prompt:
      "What user data gets included in error reports or crash logs?",
    category: "security",
  },

  // Onboarding
  {
    id: "o1",
    prompt: "Where do we validate JWTs before API handlers run?",
    category: "onboarding",
  },
  {
    id: "o2",
    prompt:
      "How does the frontend talk to the backend \u2014 REST, GraphQL, or something else?",
    category: "onboarding",
  },
  {
    id: "o3",
    prompt:
      "Where does the app decide which feature flags are active for a user?",
    category: "onboarding",
  },
  {
    id: "o4",
    prompt:
      "What is the overall request lifecycle from HTTP to database and back?",
    category: "onboarding",
  },

  // Debugging
  {
    id: "d1",
    prompt:
      "Where could a null user ID cause a crash in the checkout flow?",
    category: "debugging",
  },
  {
    id: "d2",
    prompt:
      "What logging or alerting fires when payment processing fails?",
    category: "debugging",
  },
  {
    id: "d3",
    prompt:
      "What error messages does the user see when the backend returns a 503?",
    category: "debugging",
  },
  {
    id: "d4",
    prompt:
      "How does the app behave offline or when the network is flaky?",
    category: "debugging",
  },

  // Refactoring
  {
    id: "r1",
    prompt:
      "Which services still use the legacy authentication system?",
    category: "refactoring",
  },
  {
    id: "r2",
    prompt:
      "What parts of the codebase would break if we renamed the User table?",
    category: "refactoring",
  },
  {
    id: "r3",
    prompt:
      "Where are we using deprecated APIs that need to be replaced?",
    category: "refactoring",
  },
  {
    id: "r4",
    prompt: "What runs on deploy or app startup to warm caches?",
    category: "refactoring",
  },
];

export const ANTI_PATTERNS: AntiPattern[] = [
  {
    grep: "find function handleAuth",
    clean:
      "How does the app authenticate users and manage their session?",
  },
  {
    grep: "grep for 500 status code",
    clean:
      "What happens when an internal server error occurs in the API?",
  },
  {
    grep: "search for files importing stripe",
    clean: "How does the billing system process subscription changes?",
  },
];
