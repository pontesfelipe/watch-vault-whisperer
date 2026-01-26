import { useState, useEffect } from "react";
import { NewAppLayout } from "@/components/NewAppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Watch, User, Hash, TrendingUp } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { UserAvatarById } from "@/components/UserAvatarById";

interface SearchResult {
  type: "watch" | "user" | "tag";
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "watches" | "users" | "tags">("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTrendingTags();
  }, []);

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, activeTab]);

  const fetchTrendingTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("name, usage_count")
      .order("usage_count", { ascending: false })
      .limit(10);

    if (data) {
      setTrendingTags(data.map((t) => ({ name: t.name, count: t.usage_count || 0 })));
    }
  };

  const performSearch = async () => {
    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      if (activeTab === "all" || activeTab === "watches") {
        const { data: watches } = await supabase
          .from("watches")
          .select("id, brand, model, dial_color, ai_image_url, is_shared")
          .eq("is_shared", true)
          .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
          .limit(activeTab === "all" ? 5 : 20);

        if (watches) {
          watches.forEach((w) => {
            searchResults.push({
              type: "watch",
              id: w.id,
              title: `${w.brand} ${w.model}`,
              subtitle: w.dial_color,
              imageUrl: w.ai_image_url || undefined,
            });
          });
        }
      }

      if (activeTab === "all" || activeTab === "users") {
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(activeTab === "all" ? 5 : 20);

        if (users) {
          users.forEach((u) => {
            searchResults.push({
              type: "user",
              id: u.id,
              title: u.username || u.full_name || "User",
              subtitle: u.full_name || undefined,
              imageUrl: u.avatar_url || undefined,
            });
          });
        }
      }

      if (activeTab === "all" || activeTab === "tags") {
        const { data: tags } = await supabase
          .from("tags")
          .select("id, name, category, usage_count")
          .ilike("name", `%${query}%`)
          .limit(activeTab === "all" ? 5 : 20);

        if (tags) {
          tags.forEach((t) => {
            searchResults.push({
              type: "tag",
              id: t.id,
              title: t.name,
              subtitle: `${t.usage_count || 0} uses`,
            });
          });
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.type === "watch") {
      navigate(`/watch/${result.id}`);
    } else if (result.type === "user") {
      navigate(`/profile/${result.id}`);
    } else if (result.type === "tag") {
      navigate(`/feed?tag=${result.title}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "watch":
        return <Watch className="h-5 w-5 text-muted-foreground" />;
      case "user":
        return <User className="h-5 w-5 text-muted-foreground" />;
      case "tag":
        return <Hash className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <NewAppLayout showSearch={false}>
      <div className="p-4 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search watches, users, tags..."
            className="pl-12 h-12 rounded-xl text-base"
            autoFocus
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="watches">Watches</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Trending Tags (when no search) */}
        {!query.trim() && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-medium">Trending Tags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/feed?tag=${tag.name}`)}
                >
                  #{tag.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Search Results */}
        {query.trim() && (
          <div className="space-y-2">
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelect(result)}
                  >
                    <div className="flex items-center gap-4">
                      {result.type === "user" ? (
                        <UserAvatarById userId={result.id} size="sm" />
                      ) : result.imageUrl ? (
                        <img
                          src={result.imageUrl}
                          alt={result.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          {getIcon(result.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {result.type}
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No results found for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </NewAppLayout>
  );
}
