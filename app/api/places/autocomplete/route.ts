import { NextResponse } from 'next/server';

type Suggestion = {
  id: string;
  place_name: string;
  latitude: number;
  longitude: number;
  city?: string | null;
  postcode?: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (!q) return NextResponse.json({ suggestions: [] });

  const MAPBOX_KEY = process.env.MAPBOX_API_KEY;
  if (!MAPBOX_KEY) {
    return NextResponse.json({ error: 'MAPBOX_API_KEY not configured in server env' }, { status: 500 });
  }

  try {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?autocomplete=true&limit=6&access_token=${MAPBOX_KEY}`;
    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: `Places API error: ${text}` }, { status: res.status || 502 });
    }

    const json = await res.json();
    const suggestions: Suggestion[] = (json.features || []).map((f: any) => {
      const context = f.context || [];
      const cityObj = context.find((c: any) => c.id?.startsWith('place')) || null;
      const postcodeObj = context.find((c: any) => c.id?.startsWith('postcode')) || null;

      return {
        id: f.id,
        place_name: f.place_name,
        longitude: f.center?.[0] ?? 0,
        latitude: f.center?.[1] ?? 0,
        city: cityObj ? cityObj.text : null,
        postcode: postcodeObj ? postcodeObj.text : null,
      } as Suggestion;
    });

    return NextResponse.json({ suggestions });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
