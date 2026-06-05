import React from "react";
import ReactDOM from "react-dom/client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { createShortLink, getAnalyticsSummary, type AnalyticsSummary, type CreatedLink } from "./api";
import "./styles.css";

function App() {
  const [targetUrl, setTargetUrl] = React.useState("");
  const [createdLink, setCreatedLink] = React.useState<CreatedLink | null>(null);
  const [code, setCode] = React.useState("");
  const [range, setRange] = React.useState<AnalyticsSummary["range"]>("7d");
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  async function handleCreateLink(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Creating short link...");

    try {
      const link = await createShortLink(targetUrl);
      setCreatedLink(link);
      setCode(link.code);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  async function handleLoadAnalytics(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Loading analytics...");

    try {
      const data = await getAnalyticsSummary(code, range);
      setSummary(data);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  const chartData =
    summary?.series.map((point) => ({
      ...point,
      label: new Date(point.bucket).toLocaleString()
    })) ?? [];

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Fast redirect path, async analytics path</p>
        <h1>Production-style URL shortener</h1>
        <p>
          Redis handles rate limiting and hot URL lookups. BullMQ moves click analytics off the
          redirect path so users get a fast 301 while workers write to TimescaleDB.
        </p>
      </section>

      <section className="grid">
        <form className="card" onSubmit={handleCreateLink}>
          <h2>Create short link</h2>
          <label htmlFor="targetUrl">Destination URL</label>
          <input
            id="targetUrl"
            type="url"
            placeholder="https://example.com/product"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
            required
          />
          <button type="submit">Shorten URL</button>

          {createdLink ? (
            <div className="result">
              <span>Short URL</span>
              <a href={createdLink.shortUrl} target="_blank" rel="noreferrer">
                {createdLink.shortUrl}
              </a>
            </div>
          ) : null}
        </form>

        <form className="card" onSubmit={handleLoadAnalytics}>
          <h2>Analytics lookup</h2>
          <label htmlFor="code">Short code</label>
          <input
            id="code"
            value={code}
            placeholder="abc123"
            onChange={(event) => setCode(event.target.value)}
            required
          />

          <label htmlFor="range">Range</label>
          <select
            id="range"
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsSummary["range"])}
          >
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>

          <button type="submit">Load analytics</button>
        </form>
      </section>

      {status ? <p className="status">{status}</p> : null}

      {summary ? (
        <section className="card dashboard">
          <div className="metrics">
            <div>
              <span>Total clicks</span>
              <strong>{summary.clicks}</strong>
            </div>
            <div>
              <span>Unique visitors</span>
              <strong>{summary.uniqueVisitors}</strong>
            </div>
          </div>

          <div className="chart">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
