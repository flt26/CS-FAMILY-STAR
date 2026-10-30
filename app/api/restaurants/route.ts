import { connection } from 'next/server';
import { getScoreboard } from '@/lib/reviews';
import { SPOTS } from '@/lib/spots';

// Public, read-only JSON in the same shape the first version of the app used.
// Answered per request (the scoreboard itself is cached), so an outage can be
// reported as one instead of as a hundred unrated spots.
export async function GET() {
  await connection();
  const { ok, stats } = await getScoreboard();
  if (!ok) {
    return Response.json({ error: 'Ratings are unavailable right now' }, { status: 503 });
  }
  return Response.json(
    SPOTS.map((spot) => ({
      place_id: spot.id,
      name: spot.name,
      vicinity: spot.vicinity,
      category: spot.category,
      geometry: { location: { lat: spot.lat, lng: spot.lng } },
      averageRating: stats[spot.id]?.average ?? 0,
      reviewCount: stats[spot.id]?.count ?? 0,
    })),
  );
}
