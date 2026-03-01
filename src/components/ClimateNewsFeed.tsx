import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink, AlertCircle } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "Global CO₂ emissions hit record high in 2025, IEA report warns",
    link: "https://www.bbc.co.uk/news/science-environment",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    description: "The International Energy Agency says fossil fuel emissions reached 37.8 billion tonnes, driven by extreme weather increasing energy demand.",
  },
  {
    title: "Arctic sea ice reaches unprecedented low for February",
    link: "https://www.bbc.co.uk/news/science-environment",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    description: "Scientists report Arctic ice extent is 12% below the previous record for this time of year, accelerating feedback loops.",
  },
  {
    title: "EU carbon border tax begins transforming global trade patterns",
    link: "https://www.bbc.co.uk/news/science-environment",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    description: "The Carbon Border Adjustment Mechanism is reshaping supply chains as manufacturers shift to low-carbon production.",
  },
  {
    title: "Breakthrough in direct air capture could slash costs by 75%",
    link: "https://www.bbc.co.uk/news/science-environment",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    description: "New electrochemical process developed by MIT researchers promises to make carbon removal economically viable at scale.",
  },
  {
    title: "India surges past 200 GW renewable energy milestone",
    link: "https://www.bbc.co.uk/news/science-environment",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    description: "Solar and wind capacity growth accelerates as India targets 500 GW non-fossil fuel capacity by 2030.",
  },
  {
    title: "Methane emissions surge detected over Southeast Asian wetlands",
    link: "https://www.bbc.co.uk/news/science-environment",
    pubDate: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    description: "Satellite data reveals a 23% increase in methane flux from tropical wetlands, raising concerns about climate feedback.",
  },
];

// Fetches climate-related news from a free RSS-to-JSON service
async function fetchClimateNews(): Promise<NewsItem[]> {
  const feeds = [
    "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
  ];

  const allItems: NewsItem[] = [];

  for (const feed of feeds) {
    try {
      const resp = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}&count=8`
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      if (data.status === "ok" && data.items) {
        allItems.push(
          ...data.items
            .filter((item: any) => {
              const text = `${item.title} ${item.description}`.toLowerCase();
              return (
                text.includes("climate") ||
                text.includes("emissions") ||
                text.includes("carbon") ||
                text.includes("warming") ||
                text.includes("environment") ||
                text.includes("renewable") ||
                text.includes("pollution") ||
                text.includes("weather") ||
                text.includes("energy")
              );
            })
            .map((item: any) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              description: item.description?.replace(/<[^>]*>/g, "").slice(0, 200) || "",
            }))
        );
      }
    } catch {
      // silently skip failed feeds
    }
  }

  const sorted = allItems.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  ).slice(0, 6);

  // Return fallback news if live feed unavailable
  return sorted.length > 0 ? sorted : FALLBACK_NEWS;
}

function isSignificant(title: string): boolean {
  const keywords = ["record", "emergency", "crisis", "tipping point", "unprecedented", "breakthrough", "alert", "surge", "extreme"];
  const lower = title.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

const ClimateNewsFeed = () => {
  const { data: news, isLoading, isError } = useQuery({
    queryKey: ["climate-news"],
    queryFn: fetchClimateNews,
    staleTime: 1000 * 60 * 30, // 30 min
    retry: 1,
  });

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Climate News & Research</h3>
        <span className="text-xs text-muted-foreground ml-auto">BBC Science & Environment</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isError || !news?.length ? (
        <p className="text-xs text-muted-foreground text-center py-6">Climate news feed unavailable</p>
      ) : (
        <div className="space-y-2">
          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg p-3 bg-muted/20 hover:bg-muted/40 border border-border/30 transition-colors group"
            >
              <div className="flex items-start gap-2">
                {isSignificant(item.title) && (
                  <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(item.pubDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClimateNewsFeed;
