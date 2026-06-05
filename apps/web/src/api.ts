const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type CreatedLink = {
  id: string;
  code: string;
  targetUrl: string;
  shortUrl: string;
  createdAt: string;
};

export type AnalyticsSummary = {
  code: string;
  range: "24h" | "7d" | "30d";
  clicks: number;
  uniqueVisitors: number;
  series: Array<{
    bucket: string;
    clicks: number;
  }>;
};

export async function createShortLink(targetUrl: string): Promise<CreatedLink> {
  const response = await fetch(`${API_BASE_URL}/api/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ targetUrl })
  });

  if (!response.ok) {
    throw new Error("Failed to create short link");
  }

  return response.json();
}

export async function getAnalyticsSummary(
  code: string,
  range: AnalyticsSummary["range"]
): Promise<AnalyticsSummary> {
  const params = new URLSearchParams({ code, range });
  const response = await fetch(`${API_BASE_URL}/api/analytics/summary?${params}`);

  if (!response.ok) {
    throw new Error("Failed to load analytics");
  }

  return response.json();
}
