import { NextResponse } from 'next/server';

// 2 days in seconds (172800s)
export const revalidate = 172800;

// Makerlab Experience Hub Place ID (from Google Maps CID / Place details)
const PLACE_ID = 'ChIJQ8zQPqrrtT4R67nCpIonkWc';

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Fallback data if API key is missing or request fails
  const fallbackData = {
    rating: 5.0,
    userRatingCount: 133,
    reviews: [
      {
        authorName: 'Xenia Marific Dayo',
        profilePhotoUrl: null,
        rating: 5,
        relativePublishTimeDescription: 'a month ago',
        text: 'We had so much fun while learning throughout this workshop. Thank you for such an engaging and insightful experience! :)',
      },
      {
        authorName: 'Miss Len',
        profilePhotoUrl: null,
        rating: 5,
        relativePublishTimeDescription: '2 months ago',
        text: 'Wonderful experience! The staff is very accommodating and knowledgeable about 3D printing and digital fabrication.',
      },
      {
        authorName: 'Gabriel S.',
        profilePhotoUrl: null,
        rating: 5,
        relativePublishTimeDescription: '3 months ago',
        text: 'Great hands-on 3D printing workshop for beginners and kids. Very clean facility and complete equipment.',
      },
      {
        authorName: 'Patricia M.',
        profilePhotoUrl: null,
        rating: 5,
        relativePublishTimeDescription: '3 months ago',
        text: 'Highly recommended! Learned a lot about 3D design and printing in just one session. Will definitely visit again!',
      },
    ],
    cachedAt: new Date().toISOString(),
    isFallback: true,
  };

  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY is not defined in environment variables.');
    return NextResponse.json(fallbackData);
  }

  try {
    // Places API (New) FieldMask: rating, userRatingCount, reviews
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${PLACE_ID}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
        },
        next: { revalidate: 172800 }, // Cache response in Next.js Data Cache for 48 hours (2 days)
      }
    );

    if (!response.ok) {
      // Try legacy Places API endpoint as backup if New API is not enabled
      const legacyResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=rating,user_ratings_total,reviews&key=${apiKey}`,
        { next: { revalidate: 172800 } }
      );

      if (legacyResponse.ok) {
        const legacyJson = await legacyResponse.json();
        if (legacyJson.result) {
          return NextResponse.json({
            rating: legacyJson.result.rating ?? 5.0,
            userRatingCount: legacyJson.result.user_ratings_total ?? 133,
            reviews: (legacyJson.result.reviews || []).slice(0, 5).map((r: any) => ({
              authorName: r.author_name,
              profilePhotoUrl: r.profile_photo_url,
              rating: r.rating,
              relativePublishTimeDescription: r.relative_time_description,
              text: r.text,
            })),
            cachedAt: new Date().toISOString(),
            isFallback: false,
          });
        }
      }

      const errorText = await response.text();
      console.error('Google Places API error:', response.status, errorText);
      return NextResponse.json(fallbackData);
    }

    const data = await response.json();

    const formattedReviews = (data.reviews || []).slice(0, 5).map((r: any) => ({
      authorName: r.authorAttribution?.displayName || 'Visitor',
      profilePhotoUrl: r.authorAttribution?.photoUri || null,
      rating: r.rating,
      relativePublishTimeDescription: r.relativePublishTimeDescription || '',
      text: r.text?.text || r.originalText?.text || '',
    }));

    return NextResponse.json({
      rating: data.rating ?? 5.0,
      userRatingCount: data.userRatingCount ?? 133,
      reviews: formattedReviews,
      cachedAt: new Date().toISOString(),
      isFallback: false,
    });
  } catch (err) {
    console.error('Failed to fetch Google reviews:', err);
    return NextResponse.json(fallbackData);
  }
}
