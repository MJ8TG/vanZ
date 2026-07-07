import { datasql } from '@/lib/supabase';

const firstOrNull = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export interface ReviewJob {
  id: string;
  client_id: string;
  status: string;
  accepted_bid_id: string | null;
}

export class ReviewService {
  /** Whether the reviewer already left a review for this job (UNIQUE(job_id, reviewer_id)). */
  static async hasReviewed(jobId: string, reviewerId: string): Promise<boolean> {
    const { data } = await datasql
      .from('reviews')
      .select('id')
      .eq('job_id', jobId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();
    return !!data;
  }

  static async fetchJob(jobId: string): Promise<ReviewJob | null> {
    const { data, error } = await datasql
      .from('jobs')
      .select('id, client_id, status, accepted_bid_id')
      .eq('id', jobId)
      .single();
    if (error || !data) return null;
    return data as ReviewJob;
  }

  /** Resolves the accepted bid's driver id + name, or null. */
  static async fetchAcceptedDriver(bidId: string): Promise<{ driverId: string; firstName: string; lastName: string } | null> {
    const { data: bid, error } = await datasql
      .from('bids')
      .select('driver_id, drivers(users!drivers_id_fkey(first_name, last_name))')
      .eq('id', bidId)
      .single();
    if (error || !bid) return null;
    const driver = firstOrNull((bid as any).drivers);
    const user = firstOrNull(driver?.users);
    return { driverId: (bid as any).driver_id, firstName: user?.first_name || '', lastName: user?.last_name || '' };
  }

  static async submitReview(input: {
    jobId: string;
    reviewerId: string;
    revieweeId: string;
    stars: number;
    comment: string | null;
    tags: string[];
  }): Promise<void> {
    const { error } = await datasql.from('reviews').insert({
      job_id: input.jobId,
      reviewer_id: input.reviewerId,
      reviewee_id: input.revieweeId,
      reviewer_type: 'client',
      stars: input.stars,
      comment: input.comment,
      tags: input.tags,
    });
    if (error) throw error;
  }
}
