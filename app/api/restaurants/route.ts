import { getScoreboard } from '@/lib/reviews';
import { SPOTS } from '@/lib/spots';

// Public, read-only JSON in the same shape the first version of the app used.
export async function GET() {
  const { stats } = await getScoreboard();
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
