/** Accounts offered as one-click sign-ins on the public demo. */
export const DEMO_ACCOUNTS = [
  {
    username: "layla.mansour",
    label: "Admin",
    description: "Runs the press: orders, stock, sales",
  },
  { username: "omar.haddad", label: "Designer", description: "Works the design stage" },
  { username: "yousef.ali", label: "Printer", description: "Works the printing stage" },
] as const;

export type DemoUsername = (typeof DEMO_ACCOUNTS)[number]["username"];

export const DEMO_USERNAMES = DEMO_ACCOUNTS.map((a) => a.username) as [
  DemoUsername,
  ...DemoUsername[],
];
