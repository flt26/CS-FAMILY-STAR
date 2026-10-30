import { getSpotReviews } from '@/lib/reviews';
import { isSpotId } from '@/lib/spots';

// Read-only. Reviews are written through the submitReview server action, which
// validates, rate-limits and uploads photos before anything reaches Supabase.
export async function GET(request: Request) {
  const spotId = new URL(request.url).searchParams.get('restaurant_id');
  if (!isSpotId(spotId)) {
    return Response.json({ error: 'Unknown restaurant_id' }, { status: 400 });
  }

  const { ok, reviews } = await getSpotReviews(spotId);
  if (!ok) {
    return Response.json({ error: 'Reviews are unavailable right now' }, { status: 503 });
  }

  return Response.json(
    reviews.map((review) => ({
      id: review.id,
      restaurant_id: review.spotId,
      rating: review.rating,
      comment: review.comment,
      user_name: review.name,
      image_url: review.imageUrl,
      created_at: review.createdAt,
    })),
  );
}
