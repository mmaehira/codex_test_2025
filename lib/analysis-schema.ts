import { z } from "zod";

export const analysisSchema = z.object({
  summary: z.string(),
  background: z.array(z.string()),
  timeline_positioning: z.array(z.string()),
  geopolitical_impact: z.array(z.string()),
  market_impact: z.object({
    equities: z.array(z.string()),
    rates: z.array(z.string()),
    fx: z.array(z.string()),
    commodities: z.array(z.string()),
    credit: z.array(z.string())
  }),
  uncertainties: z.array(z.string()),
  what_to_watch_next: z.array(z.string())
});

export type AnalysisPayload = z.infer<typeof analysisSchema>;
