export type MatchableAlert = {
  id: string;
  type: string;
  personName: string | null;
  personAge: number | null;
  personSex: string | null;
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  dateOccurred: Date | null;
  description: string;
};

export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase().trim();
  const t = b.toLowerCase().trim();
  const m = s.length, n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function nameSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.trim().length, b.trim().length, 1);
  return Math.max(0, 1 - dist / maxLen);
}

export function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distanceScore(distanceKm: number | null): number {
  if (distanceKm === null) return 0.5;
  if (distanceKm <= 5) return 1;
  if (distanceKm >= 300) return 0;
  return 1 - distanceKm / 300;
}

function dateScore(deltaDays: number | null): number {
  if (deltaDays === null) return 0.5;
  const abs = Math.abs(deltaDays);
  if (abs <= 2) return 1;
  if (abs >= 60) return 0;
  return 1 - abs / 60;
}

function locationTextScore(a: MatchableAlert, b: MatchableAlert): number {
  const norm = (s: string | null) => (s || "").trim().toLowerCase();
  if (!norm(a.city) && !norm(b.city)) return 0.5;
  if (norm(a.city) && norm(a.city) === norm(b.city)) return 1;
  if (norm(a.region) && norm(a.region) === norm(b.region)) return 0.6;
  return 0.1;
}

export type MatchResult = {
  targetId: string;
  score: number;
  nameScore: number;
  distanceKm: number | null;
  dateDeltaDays: number | null;
};

export function computeMatchScore(a: MatchableAlert, b: MatchableAlert): MatchResult {
  const nScore = nameSimilarity(a.personName, b.personName);

  let distanceKm: number | null = null;
  let locScore: number;
  if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
    distanceKm = haversineKm(a.lat, a.lng, b.lat, b.lng);
    locScore = distanceScore(distanceKm);
  } else {
    locScore = locationTextScore(a, b);
  }

  let dateDeltaDays: number | null = null;
  if (a.dateOccurred && b.dateOccurred) {
    dateDeltaDays = Math.round(
      (a.dateOccurred.getTime() - b.dateOccurred.getTime()) / 86400000
    );
  }
  const dScore = dateScore(dateDeltaDays);

  let ageBonus = 0;
  if (a.personAge != null && b.personAge != null) {
    ageBonus = Math.abs(a.personAge - b.personAge) <= 2 ? 0.05 : 0;
  }

  const composite = nScore * 0.5 + locScore * 0.3 + dScore * 0.2 + ageBonus;

  return {
    targetId: b.id,
    score: Math.min(1, Math.round(composite * 1000) / 1000),
    nameScore: Math.round(nScore * 1000) / 1000,
    distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
    dateDeltaDays,
  };
}

export const MATCH_MIN_SCORE = 0.35;

export function rankMatches(
  source: MatchableAlert,
  candidates: MatchableAlert[]
): MatchResult[] {
  return candidates
    .filter((c) => c.id !== source.id)
    .map((c) => computeMatchScore(source, c))
    .filter((r) => r.score >= MATCH_MIN_SCORE)
    .sort((x, y) => y.score - x.score);
}
