export type DashboardRange = '7' | '30' | '90' | 'all';
export type DashboardVariant = 'all' | 'a' | 'b';
export type DashboardFilter = { range: DashboardRange; variant: DashboardVariant; page: number };
export type FunnelStep = { name: string; label: string; sessions: number };
export type DashboardData = {
  generatedAt: string;
  filter: DashboardFilter;
  overview: {
    measuredSessions: number;
    uniqueLeads: number;
    captures: number;
    marketingLeads: number;
    measuredNewLeads: number;
    convertedSessions: number;
    unmeasuredCaptures: number;
    conversionPct: number | null;
  };
  traffic: { source: string; medium: string; campaign: string; variant: string; sessions: number; started: number; submitted: number; withoutSubmission: number; activeWithoutSubmission: number; startedWithoutSubmission: number }[];
  formOutcomes: { sessions: number; started: number; submitted: number; withoutSubmission: number; activeWithoutSubmission: number; startedWithoutSubmission: number };
  funnel: FunnelStep[];
  daily: { day: string; measuredSessions: number; uniqueLeads: number; captures: number }[];
  campaigns: { source: string; medium: string; campaign: string; variant: string; captures: number; newLeads: number }[];
  comparisons: { first: string; second: string; selections: number; sessions: number }[];
  submittedComparisons: { first: string; second: string; captures: number }[];
  leads: { id: string; email: string; createdAt: string; marketingConsent: boolean; captures: number }[];
  leadTotal: number;
  events: { time: string; name: string; source: string; variant: string; first: string | null; second: string | null }[];
};
