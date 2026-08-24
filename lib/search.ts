export type RankableAlert = {
  id: string;
  type: string;
  title: string;
  description: string;
  city: string | null;
  createdAt: Date;
  contributionsCount?: number;
};

const URGENT_TYPES = new Set(["MISSING_PERSON", "DANGEROUS_SITUATION"]);

function textMatchScore(query: string, alert: RankableAlert): number {
  if (!query) return 0;
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const title = alert.title.toLowerCase();
  const desc = alert.description.toLowerCase();
  let score = 0;
  if (title.includes(q)) score += 2;
  if (title.startsWith(q)) score += 1;
  if (desc.includes(q)) score += 0.5;
  return score;
}

function recencyScore(createdAt: Date): number {
  const ageDays = (Date.now() - createdAt.getTime()) / 86400000;
  if (ageDays <= 0) return 1;
  if (ageDays >= 30) return 0.05;
  return 1 - ageDays / 30;
}

export function rankScore(alert: RankableAlert, query = ""): number {
  const textScore = textMatchScore(query, alert);
  const urgency = URGENT_TYPES.has(alert.type) ? 1 : 0.4;
  const recency = recencyScore(alert.createdAt);
  const engagement = Math.min(1, (alert.contributionsCount ?? 0) / 10);

  return textScore * 3 + urgency * 1.5 + recency * 1 + engagement * 0.5;
}

export function rankAlerts<T extends RankableAlert>(alerts: T[], query = ""): T[] {
  return [...alerts].sort((a, b) => rankScore(b, query) - rankScore(a, query));
}

export function parsePagination(searchParams: URLSearchParams) {
  const pageRaw = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 20;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
