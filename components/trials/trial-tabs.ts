/** Filter tabs on /trials (plain module: shared by the server page and the client list). */
export const TRIAL_TABS = ["upcoming", "came", "joined", "all"] as const;
export type TrialTab = (typeof TRIAL_TABS)[number];
