import { z } from '@/lib/validation/zod';

const campaign = z.string().max(64).regex(/^[a-zA-Z0-9_-]*$/);
export const acquisitionSchema = z.object({
  utm_source: campaign.optional(), utm_medium: campaign.optional(),
  utm_campaign: campaign.optional(), utm_content: campaign.optional(),
  referrer_host: z.string().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/).optional(),
}).strict();
export type Acquisition = z.infer<typeof acquisitionSchema>;

// Never send the full referrer URL, path, query string or credentials.
export function readAcquisition(href: string, referrer: string): Acquisition {
  const result: Acquisition = {};
  try {
    const url = new URL(href);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const) {
      const values = url.searchParams.getAll(key);
      if (values.length === 1 && values[0] && campaign.safeParse(values[0]).success) result[key] = values[0];
    }
    if (referrer) {
      const from = new URL(referrer);
      if (['http:', 'https:'].includes(from.protocol) && !from.username && !from.password && from.hostname !== url.hostname
        && acquisitionSchema.shape.referrer_host.safeParse(from.hostname).success) result.referrer_host = from.hostname;
    }
  } catch { /* Missing or invalid context remains unknown. */ }
  return result;
}
